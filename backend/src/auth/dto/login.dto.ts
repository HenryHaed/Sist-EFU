import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: '1000000', description: 'Carnet de Identidad del usuario' })
  ci: string;

  @ApiProperty({ example: 'password123', description: 'Contrasena del usuario' })
  password: string;
}
