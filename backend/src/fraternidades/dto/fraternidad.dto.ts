import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFraternidadDto {
  @ApiProperty({ example: 'Morenada Central' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre: string;

  @ApiProperty({ example: 'UMSA' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  origenFraternidad: string;

  @ApiProperty({ example: 'Facultad de Derecho', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nivelRepresentacion?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  idFacultad?: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  idCarrera?: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  idInstitucionExterna?: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  idCategoria: number;

  @ApiProperty({ example: 'Estudiantina', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  tipoOrganizacion?: string;

  @ApiProperty({ example: '1980-01-01', required: false })
  @IsDateString()
  @IsOptional()
  fechaFundacion?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  habilitadoEfu?: boolean;

  @ApiProperty({ example: 'https://example.com/logo.png', required: false })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ example: { chacha: "Juan" }, required: false })
  @IsOptional()
  participantesConcurso?: any;
}

export class UpdateFraternidadDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nombre?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  origenFraternidad?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nivelRepresentacion?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  idFacultad?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  idCarrera?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  idInstitucionExterna?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  idCategoria?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  tipoOrganizacion?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  fechaFundacion?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  habilitadoEfu?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  participantesConcurso?: any;
}
