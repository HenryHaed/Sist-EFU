import { IsString, IsNotEmpty, IsOptional, IsNumber, MinLength, MaxLength, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioDto {
  @ApiProperty({ example: '1234567' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  ci: string;

  @ApiProperty({ example: 'Juan Perez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombres: string;

  @ApiProperty({ example: 'Perez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  primerApellido: string;

  @ApiProperty({ example: 'Lopez', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  segundoApellido?: string;

  @ApiProperty({ example: 'juan.perez@mail.com' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  correo: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  password: string;

  @ApiProperty({ example: 4, description: 'ID del Rol (e.g. 4 = delegado, 5 = jurado)' })
  @IsNumber()
  @IsNotEmpty()
  idRol: number;

  @ApiProperty({ example: 1, required: false, description: 'SÍ el usuario es delegado, ID de su fraternidad' })
  @IsNumber()
  @IsOptional()
  idFraternidad?: number;

  @ApiProperty({ required: false, description: 'Si el delegado crea una nueva fraternidad, enviar su nombre' })
  @IsString()
  @IsOptional()
  nuevaFraternidad?: string;
}

export class UpdateUsuarioDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  ci?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  nombres?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  primerApellido?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  segundoApellido?: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  correo?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  idRol?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  idFraternidad?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  nuevaFraternidad?: string;
}
