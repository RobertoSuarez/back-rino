import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ description: 'El correo del usuario' })
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Contraseña del usuario' })
  readonly password: string;
}

export class LoginResponseDto {
  @ApiProperty()
  user: any;

  @ApiProperty()
  firstLogin: boolean;

  @ApiProperty()
  accessToken: string;
}

export class RecoverPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'El correo del usuario para recuperar la contraseña',
  })
  email: string;
}

export class SetterPasswordDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'El token de recuperación de la contraseña.' })
  token: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'La nueva contraseña del usuario.' })
  newPassword: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'La nueva contraseña del usuario.' })
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'La nueva contraseña del usuario.' })
  newPassword: string;
}
