import { IsEmail, IsIn, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export const ROLES_COMUNICADO = ['controladorhcu', 'delegado', 'jurado', 'admin'] as const;
export type RolComunicado = (typeof ROLES_COMUNICADO)[number];

export class EnviarComunicadoDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(ROLES_COMUNICADO)
  rolDestinatario: RolComunicado;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  asunto: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(10000)
  mensaje: string;
}

export class EnviarMensajeIndividualDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  correo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  asunto: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(10000)
  mensaje: string;
}
