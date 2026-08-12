import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { EmailService } from '../email/email.service';
import { generateToken } from '../../common/generate-token.util';
import { DRIZZLE } from 'src/database/database.constants';
import { usersTable, userInvitesTable, eq, type db as Db } from 'db';

const POSTGRES_UNIQUE_VIOLATION = '23505';
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, matches the refresh token TTL

// node-postgres errors carry `.code`, but drizzle-orm wraps them in a
// DrizzleQueryError, so the pg error ends up at `.cause` instead — same
// unwrap auth.service.ts uses for the same unique-email constraint.
function isUniqueViolation(err: unknown): boolean {
  const pgError =
    typeof err === 'object' && err !== null && 'cause' in err
      ? err.cause
      : err;
  return (
    typeof pgError === 'object' &&
    pgError !== null &&
    'code' in pgError &&
    pgError.code === POSTGRES_UNIQUE_VIOLATION
  );
}

function toUser(row: typeof usersTable.$inferSelect): User {
  return {
    id: row.id,
    accountId: row.accountId,
    firstName: row.firstname,
    lastName: row.lastname,
    phone: row.phone,
    email: row.email,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE) private readonly db: typeof Db,
    private readonly emailService: EmailService,
  ) {}

  async getByEmail(email: string) {
    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    return user;
  }

  async getByInviteToken(token: string) {
    const [row] = await this.db
      .select({ user: usersTable, expiresAt: userInvitesTable.expiresAt })
      .from(userInvitesTable)
      .innerJoin(usersTable, eq(userInvitesTable.userId, usersTable.id))
      .where(eq(userInvitesTable.token, token));

    return row;
  }

  // sets the user's real password and consumes the invite — called once
  // they follow the emailed link and choose one. Returns undefined if the
  // user no longer exists (e.g. deleted between the invite lookup and this
  // call) rather than assuming the update always finds a row.
  async activate(id: number, hashedPassword: string): Promise<User | undefined> {
    const [user] = await this.db
      .update(usersTable)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning();

    if (!user) return undefined;

    await this.db.delete(userInvitesTable).where(eq(userInvitesTable.userId, id));

    return toUser(user);
  }

  // no password is set here — the account owner invites a staff member and
  // they join later via the emailed invite link, at which point they set
  // their own. The user + invite rows are inserted together so a failure
  // partway through never leaves a user with no way to ever join.
  async create(dto: CreateUserDto, accountId: number): Promise<User> {
    try {
      const { user, token } = await this.db.transaction(async (tx) => {
        const [user] = await tx
          .insert(usersTable)
          .values({
            firstname: dto.firstName,
            lastname: dto.lastName,
            phone: dto.phone,
            email: dto.email,
            accountId,
          })
          .returning();

        const token = generateToken(32);
        await tx.insert(userInvitesTable).values({
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + INVITE_TTL_MS),
        });

        return { user, token };
      });

      const inviteUrl = `${process.env.SHOP_ADMIN_WEB_URL ?? 'http://localhost:5000'}/join?token=${token}`;
      await this.emailService.sendInviteEmail(user.email, {
        firstName: user.firstname,
        inviteUrl,
      });

      return toUser(user);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException('Email already in use');
      }
      throw err;
    }
  }

  async findAll(accountId: number): Promise<User[]> {
    const rows = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.accountId, accountId));

    return rows.map(toUser);
  }
}
