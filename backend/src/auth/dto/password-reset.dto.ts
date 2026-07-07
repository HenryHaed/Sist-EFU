import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: '1234567' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  ci: string;
}

export class VerifyResetCodeDto {
  @ApiProperty({ example: '1234567' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  ci: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(6)
  code: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @ApiProperty({ example: 'NuevaPass1' })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'NuevaPass1' })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
