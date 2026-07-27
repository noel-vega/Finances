import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SignInDto } from './dto/signin.dto';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async signin(signinDto: SignInDto) {
    const user = await this.usersService.getByEmail(signinDto.email);

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.password !== signinDto.password) {
      throw new UnauthorizedException();
    }

    const access_token = await this.createAccessToken(user.id, user.email);

    return {userId: user.id, email: user.email, access_token };
  }

  private async createToken(sub: number, email: string, expiresIn: string) {
    const payload = { sub, email };
    const token =  await this.jwtService.signAsync(payload, {
      expiresIn: '7Days' 
    });
    return token
  }

  async createAccessToken(sub: number, email: string) {
    return await this.createToken(sub, email, '8h')
  }


  async createRefreshToken(sub: number, email: string) {
    return await this.createToken(sub, email, '7d')
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      // Returns the decoded payload if valid
      const payload = await this.jwtService.verifyAsync(refreshToken);
      const token = await this.createAccessToken(payload.sub, payload.email)
      return token
    } catch (error) {
      // Throws error if token is expired, tampered, or invalid
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
