import { IsNotEmpty, IsString, MaxLength, IsDateString } from 'class-validator';

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
}
