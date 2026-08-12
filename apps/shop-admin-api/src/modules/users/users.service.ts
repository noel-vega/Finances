import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { DRIZZLE } from 'src/database/database.constants';
import { usersTable, eq, type db as Db } from 'db';

const POSTGRES_UNIQUE_VIOLATION = '23505';

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
  constructor(@Inject(DRIZZLE) private readonly db: typeof Db) {}

  async getByEmail(email: string) {
    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    return user;
  }

  // no password is set here — the account owner invites a staff member and
  // they join later via an email link, at which point they set their own
  async create(dto: CreateUserDto, accountId: number): Promise<User> {
    try {
      const [user] = await this.db
        .insert(usersTable)
        .values({
          firstname: dto.firstName,
          lastname: dto.lastName,
          phone: dto.phone,
          email: dto.email,
          accountId,
        })
        .returning();

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
