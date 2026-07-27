import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/signin.dto';
import { AccessTokenDto } from './dto/access-token.dto';
import { Public } from './auth.decorators';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ApiBearerAuth, ApiOkResponse, ApiResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';

const REFRESH_TOKEN_COOKIE = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signin')
  @ApiOkResponse({ type: AccessTokenDto })
  @ApiUnauthorizedResponse()
  async signin(
    @Body() signinDto: SignInDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<AccessTokenDto> {
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

    return { access_token: result.access_token };
  }

  @Public()
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: AccessTokenDto })
  @ApiUnauthorizedResponse()
  @Get('token/refresh')
  async refreshToken(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<AccessTokenDto> {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const access_token = await this.authService.refreshAccessToken(refreshToken);
    return { access_token };
  }
}
