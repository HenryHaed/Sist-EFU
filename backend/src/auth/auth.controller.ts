import { Controller, Post, Body, Get, UseGuards, Request, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { LoginDto } from './dto/login.dto';
import {
  ForgotPasswordDto,
  VerifyResetCodeDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/password-reset.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Autenticacion')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  @Public()
  @ApiOperation({ summary: 'Iniciar sesion en el sistema' })
  @ApiResponse({ status: 201, description: 'Login exitoso. Devuelve el JWT.' })
  @ApiResponse({ status: 401, description: 'Credenciales invalidas.' })
  @Post('login')
  login(@Body() loginDto: LoginDto, @Req() req: any) {
    return this.authService.login(loginDto, req);
  }

  @Public()
  @ApiOperation({ summary: 'Solicitar codigo de recuperacion de contraseña' })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordResetService.forgotPassword(dto.ci);
  }

  @Public()
  @ApiOperation({ summary: 'Verificar codigo OTP de recuperacion' })
  @Post('verify-reset-code')
  verifyResetCode(@Body() dto: VerifyResetCodeDto) {
    return this.passwordResetService.verifyResetCode(dto.ci, dto.code);
  }

  @Public()
  @ApiOperation({ summary: 'Restablecer contraseña con token de recuperacion' })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(dto.resetToken, dto.newPassword);
  }

  @ApiOperation({ summary: 'Obtener datos del usuario logueado en base al token' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: any) {
    return req.user;
  }

  @ApiOperation({ summary: 'Cambiar contraseña de usuario' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.idUsuario, dto.newPassword);
  }

  @ApiOperation({ summary: 'Cerrar sesión y registrar fin de sesión' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any) {
    await this.auditoriaService.cerrarSesionPorHeader(req.headers['x-session-id']);
    return { ok: true };
  }
}
