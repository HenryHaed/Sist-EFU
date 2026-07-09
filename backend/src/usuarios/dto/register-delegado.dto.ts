import { IsString, IsNotEmpty, IsOptional, MaxLength, IsEmail, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const CI_USUARIO_REGEX = /^\d{5,20}$/;
const CI_USUARIO_MSG = 'El CI debe contener solo números y al menos 5 dígitos.';

export class RegisterDelegadoDto {
  @ApiProperty({ example: '1234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(CI_USUARIO_REGEX, { message: CI_USUARIO_MSG })
  @MaxLength(20)
  ci: string;

  @ApiProperty({ example: 'Juan' })
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

  @ApiProperty({ example: 'delegado@mail.com' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  correo: string;
}
