import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SignInDto } from './dto/signin.dto';
import { SignUpDto } from './dto/signup.dto';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { DRIZZLE } from 'src/database/database.constants';
import {
  accountApiKeysTable,
  accountsTable,
  locationsTable,
  usersTable,
  type db as Db,
} from 'db';
import * as bcrypt from 'bcryptjs';
import { generateApiKey } from '../api-keys/api-keys.util';

const POSTGRES_UNIQUE_VIOLATION = '23505';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: typeof Db,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async signin(signinDto: SignInDto) {
    const user = await this.usersService.getByEmail(signinDto.email);

    if (!user) {
      throw new UnauthorizedException();
    }

    if (!(await bcrypt.compare(signinDto.password, user.password))) {
      throw new UnauthorizedException();
    }

    const access_token = await this.createAccessToken(
      user.id,
      user.email,
      user.accountId,
      user.firstname,
      user.lastname,
    );

    return {
      userId: user.id,
      email: user.email,
      accountId: user.accountId,
      firstName: user.firstname,
      lastName: user.lastname,
      access_token,
    };
  }

  async signup(signupDto: SignUpDto) {
    try {
      const user = await this.db.transaction(async (tx) => {
        const [account] = await tx
          .insert(accountsTable)
          .values({ name: signupDto.businessName })
          .returning();

        await tx.insert(accountApiKeysTable).values({
          accountId: account.id,
          key: generateApiKey(),
        });

        // products need somewhere to hold stock — every account starts
        // with a single seeded location, see locationsTable
        await tx.insert(locationsTable).values({
          accountId: account.id,
          name: 'Default',
        });

        const hashedPassword = await bcrypt.hash(signupDto.password, 10);

        const [user] = await tx
          .insert(usersTable)
          .values({
            firstname: signupDto.firstName,
            lastname: signupDto.lastName,
            email: signupDto.email,
            password: hashedPassword,
            accountId: account.id,
          })
          .returning();

        return user;
      });

      const access_token = await this.createAccessToken(
        user.id,
        user.email,
        user.accountId,
        user.firstname,
        user.lastname,
      );

      return {
        userId: user.id,
        email: user.email,
        accountId: user.accountId,
        firstName: user.firstname,
        lastName: user.lastname,
        access_token,
      };
    } catch (err) {
      // node-postgres errors carry `.code`, but drizzle-orm wraps them in a
      // DrizzleQueryError, so the pg error ends up at `.cause` instead.
      const pgError =
        typeof err === 'object' && err !== null && 'cause' in err
          ? err.cause
          : err;

      if (
        typeof pgError === 'object' &&
        pgError !== null &&
        'code' in pgError &&
        pgError.code === POSTGRES_UNIQUE_VIOLATION
      ) {
        throw new ConflictException('Email already in use');
      }
      throw err;
    }
  }

  private async createToken(
    sub: number,
    email: string,
    accountId: number,
    firstName: string,
    lastName: string,
    expiresIn: string,
  ) {
    const payload = { sub, email, accountId, firstName, lastName };
    const token =  await this.jwtService.signAsync(payload, {
      expiresIn: '7Days'
    });
    return token
  }

  async createAccessToken(
    sub: number,
    email: string,
    accountId: number,
    firstName: string,
    lastName: string,
  ) {
    return await this.createToken(sub, email, accountId, firstName, lastName, '8h')
  }


  async createRefreshToken(
    sub: number,
    email: string,
    accountId: number,
    firstName: string,
    lastName: string,
  ) {
    return await this.createToken(sub, email, accountId, firstName, lastName, '7d')
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      // Returns the decoded payload if valid
      const payload = await this.jwtService.verifyAsync(refreshToken);
      const token = await this.createAccessToken(
        payload.sub,
        payload.email,
        payload.accountId,
        payload.firstName,
        payload.lastName,
      )
      return token
    } catch (error) {
      // Throws error if token is expired, tampered, or invalid
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
