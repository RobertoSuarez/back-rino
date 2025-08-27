import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UserDto {
  @Expose()
  @ApiProperty()
  readonly id: number;

  @Expose()
  @ApiProperty()
  readonly firstName: string;

  @Expose()
  @ApiProperty()
  readonly lastName: string;

  @Expose()
  @ApiProperty()
  readonly email: string;

  @Expose()
  @ApiProperty()
  readonly birthday: Date;

  @Expose()
  @ApiProperty()
  readonly whatsApp: string;

  @Expose()
  @ApiProperty()
  readonly urlAvatar: string;

  @Expose()
  @ApiProperty()
  readonly status: string;

  @Expose()
  @ApiProperty()
  readonly typeUser: string;

  @Expose()
  @ApiProperty()
  readonly requiredUpdate: boolean;
}

export class CreateUserDto {
  @IsString({ message: 'El nombre debe ser un string' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @ApiProperty()
  readonly firstName: string;

  @IsString({ message: 'El apellido debe ser un string' })
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @ApiProperty()
  readonly lastName: string;

  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  @ApiProperty()
  readonly email: string;

  @IsString({ message: 'La contraseña debe ser un string' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @ApiProperty()
  readonly password: string;

  @IsNotEmpty({ message: 'La fecha de nacimiento es requerida' })
  readonly birthday: string;

  @IsEnum(['student', 'teacher', 'admin'])
  @IsNotEmpty()
  @ApiProperty({ enum: ['student', 'teacher', 'admin'] })
  readonly typeUser: string;

  // @IsString()
  // @IsNotEmpty()
  // @ApiProperty()
  // readonly whatsApp: string;

  // @IsUrl()
  // @IsNotEmpty()
  // @ApiProperty()
  // readonly urlAvatar: string;

  // @IsEnum(['active', 'inactive'])
  // @IsNotEmpty()
  // @ApiProperty()
  // readonly status: string;
}

export class UserUpdateDto {
  @IsString({ message: 'El nombre debe ser un string' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @ApiProperty()
  readonly firstName?: string;

  @IsString({ message: 'El apellido debe ser un string' })
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @ApiProperty()
  readonly lastName?: string;

  @IsNotEmpty({ message: 'La fecha de nacimiento es requerida' })
  readonly birthday?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly whatsApp?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly urlAvatar?: string;
}

export class LivesWithGemsDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  lives: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  gems: number;
}
