import { IsNotEmpty, IsString, MaxLength, IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class CrearEventoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre: string;

  @IsDateString()
  fechaHora: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  ubicacion: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;

  /** true = público (landing). false = privado (solo delegados + correo). */
  @IsOptional()
  @IsBoolean()
  esPublico?: boolean;
}
