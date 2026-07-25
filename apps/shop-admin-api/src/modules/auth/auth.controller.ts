import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-auth.dto';
import { SignInDto } from './dto/signin.dto';
import { Public } from './auth.decorators';
import type { FastifyReply, FastifyRequest } from 'fastify';

const REFRESH_TOKEN_COOKIE = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.createUser(createUserDto);
  }

  @Public()
  @Post('signin')
  async signin(
    @Body() signinDto: SignInDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const result = await this.authService.signin(signinDto);

    const refreshToken = await this.authService.createRefreshToken(
      result.userId,
      result.email,
    );

    res.setCookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true, // Prevents client-side JS from accessing the cookie
      // secure: true, // Required for HTTPS environments
      sameSite: 'lax', // Helps protect against CSRF attacks
      path: '/', // Scopes the cookie to the entire domain
      maxAge: 60 * 60 * 24 * 7, // 7 days 
    });

    return result;
  }

  @Public()
  @Get('token/refresh')
  async refreshToken(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const access_token = await this.authService.refreshAccessToken(refreshToken);

    return {
      access_token,
    };
  }

  @Get()
  findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
}
