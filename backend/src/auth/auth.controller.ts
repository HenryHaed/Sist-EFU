import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Autenticacion')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Iniciar sesion en el sistema' })
  @ApiResponse({ status: 201, description: 'Login exitoso. Devuelve el JWT.' })
  @ApiResponse({ status: 401, description: 'Credenciales invalidas.' })
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Obtener datos del usuario logueado en base al token' })
  @ApiBearerAuth() // Indica que esta ruta requiere el token Bearer
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: any) {
    return req.user;
  }

  @ApiOperation({ summary: 'Cambiar contraseña de usuario' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@Request() req: any, @Body('newPassword') newPassword: string) {
    return this.authService.changePassword(req.user.idUsuario, newPassword);
  }
}
