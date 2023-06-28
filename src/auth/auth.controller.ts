import { Body, Controller, Post, Put, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';

import { AuthResponse } from './auth.response';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  public async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return new AuthResponse(await this.authService.login(loginDto, res));
  }

  @Post('register')
  public async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return new AuthResponse(await this.authService.register(registerDto, res));
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh-token')
  public async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.authService.refreshToken(refreshTokenDto, res);
  }

  @UseGuards(JwtAuthGuard)
  @Put('logout')
  public async logout(@Res() res: Response) {}
}
