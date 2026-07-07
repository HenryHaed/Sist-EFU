import { IsString, IsNotEmpty, IsOptional, MaxLength, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDelegadoDto {
  @ApiProperty({ example: '1234567' })
  @IsString()
  @IsNotEmpty()
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
