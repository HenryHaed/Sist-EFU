import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MailMessagesService } from './mail-messages.service';
import { EnviarComunicadoDto, EnviarMensajeIndividualDto } from './dto/send-message.dto';

@ApiTags('Mensajes por correo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superusuario', 'admin')
@Controller('mail')
export class MailController {
  constructor(private readonly mailMessagesService: MailMessagesService) {}

  @Get('correos/estadisticas')
  @ApiOperation({ summary: 'Cantidad de usuarios con correo por rol destinatario' })
  getEstadisticas(@Request() req: any) {
    return this.mailMessagesService.getEstadisticasCorreos(req.user?.rol || 'admin');
  }

  @Get('correos/buscar')
  @ApiOperation({ summary: 'Buscar correos registrados (autocompletado)' })
  buscarCorreos(@Query('q') q?: string) {
    return this.mailMessagesService.buscarCorreos(q || '');
  }

  @Post('comunicado-general')
  @ApiOperation({ summary: 'Enviar comunicado a usuarios de un rol específico' })
  enviarComunicadoGeneral(@Body() dto: EnviarComunicadoDto, @Request() req: any) {
    const remitente = `Administración EFU (${req.user?.rol || 'admin'})`;
    return this.mailMessagesService.enviarComunicadoGeneral(dto, remitente, req.user?.rol || 'admin');
  }

  @Post('mensaje-individual')
  @ApiOperation({ summary: 'Enviar mensaje a un correo específico' })
  enviarMensajeIndividual(@Body() dto: EnviarMensajeIndividualDto, @Request() req: any) {
    const remitente = `Administración EFU (${req.user?.rol || 'admin'})`;
    return this.mailMessagesService.enviarMensajeIndividual(dto, remitente);
  }
}
