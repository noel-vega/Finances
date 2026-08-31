import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiSecurity,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CustomerSignUpDto } from './dto/customer-signup.dto';
import { CustomerSignInDto } from './dto/customer-signin.dto';
import { AccessTokenDto } from './dto/access-token.dto';
import { CurrentAccountId } from '../app-key/app-key.decorators';
import { CurrentCartToken } from '../cart/cart.decorators';

const REFRESH_TOKEN_COOKIE = 'customer_refresh_token';

@ApiSecurity('AppKey-auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOkResponse({ type: AccessTokenDto })
  @ApiConflictResponse()
  async signup(
    @Body() dto: CustomerSignUpDto,
    @CurrentAccountId() accountId: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccessTokenDto> {
    const result = await this.authService.signup(dto, accountId);

    const refreshToken = await this.authService.createRefreshToken(
      result.customerId,
      result.email,
      result.accountId,
      result.firstName,
      result.lastName,
    );

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 * 1000,
    });

    return { access_token: result.access_token };
  }

  @Post('signin')
  @ApiOkResponse({ type: AccessTokenDto })
  @ApiUnauthorizedResponse()
  async signin(
    @Body() dto: CustomerSignInDto,
    @CurrentAccountId() accountId: number,
    @CurrentCartToken() cartToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccessTokenDto> {
    const result = await this.authService.signin(dto, accountId, cartToken);

    const refreshToken = await this.authService.createRefreshToken(
      result.customerId,
      result.email,
      result.accountId,
      result.firstName,
      result.lastName,
    );

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 * 1000,
    });

    return { access_token: result.access_token };
  }

  @Post('logout')
  @ApiOkResponse()
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
  }

  @Get('token/refresh')
  @ApiOkResponse({ type: AccessTokenDto })
  @ApiUnauthorizedResponse()
  async refreshToken(@Req() req: Request): Promise<AccessTokenDto> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as
      string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const access_token =
      await this.authService.refreshAccessToken(refreshToken);
    return { access_token };
  }
}
