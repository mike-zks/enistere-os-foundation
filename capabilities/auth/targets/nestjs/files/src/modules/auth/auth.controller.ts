import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';

import {
  ApiErrorResponse,
  ApiSuccessResponse,
} from '../../common/openapi/decorators/api-response.decorators';
import { PublicUser } from '../users/models/user.model';
import { AuthService } from './auth.service';
import { AuthenticatedPrincipal } from './contracts/authenticated-principal';
import { LoginResult } from './contracts/login-result';
import { RefreshResult } from './contracts/refresh-result';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
import { AuthThrottlerGuard } from './guards/auth-throttler.guard';
import { RefreshSessionMetadata } from './sessions/refresh-session.service';

function requestMetadata(request: Request): RefreshSessionMetadata {
  return {
    userAgent: request.headers['user-agent'],
    ipAddress: request.ip,
  };
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthThrottlerGuard)
  @SkipThrottle({ refresh: true })
  @ApiOperation({ operationId: 'auth_login', summary: 'Authentification par identifiants (login).' })
  @ApiSuccessResponse(LoginResponseDto, { description: 'Authentification réussie : access token et refresh token émis.' })
  @ApiErrorResponse(400, 'Payload invalide.')
  @ApiErrorResponse(401, 'Identifiants invalides.')
  @ApiErrorResponse(429, 'Trop de tentatives.')
  @ApiErrorResponse(500, 'Erreur interne.')
  login(@Body() dto: LoginDto, @Req() request: Request): Promise<LoginResult> {
    return this.authService.login(dto.email, dto.password, requestMetadata(request));
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthThrottlerGuard)
  @SkipThrottle({ login: true })
  @ApiOperation({ operationId: 'auth_refresh', summary: 'Rotation du refresh token (nouvelle paire de tokens).' })
  @ApiSuccessResponse(RefreshResponseDto, { description: 'Nouvelle paire de tokens (rotation du refresh token).' })
  @ApiErrorResponse(400, 'Payload invalide.')
  @ApiErrorResponse(401, 'Refresh token invalide.')
  @ApiErrorResponse(429, 'Trop de tentatives.')
  @ApiErrorResponse(500, 'Erreur interne.')
  refresh(@Body() dto: RefreshTokenDto, @Req() request: Request): Promise<RefreshResult> {
    return this.authService.refresh(dto.refreshToken, requestMetadata(request));
  }

  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'auth_logout', summary: 'Déconnexion idempotente (révocation de la famille de sessions).' })
  @ApiSuccessResponse(LogoutResponseDto, { description: 'Logout idempotent : la session courante et sa famille sont révoquées.' })
  @ApiErrorResponse(400, 'Payload invalide.')
  async logout(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request,
  ): Promise<{ status: 'logged_out' }> {
    await this.authService.logout(dto.refreshToken, requestMetadata(request));
    return { status: 'logged_out' };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ operationId: 'auth_getProfile', summary: 'Profil public de l’utilisateur authentifié.' })
  @ApiSuccessResponse(UserProfileResponseDto, { description: 'Profil public de l’utilisateur authentifié.' })
  @ApiErrorResponse(401, 'Authentification requise ou session invalide.')
  @ApiErrorResponse(500, 'Erreur interne.')
  me(@CurrentUser() principal: AuthenticatedPrincipal): Promise<PublicUser> {
    return this.authService.getProfile(principal.userId);
  }

}
