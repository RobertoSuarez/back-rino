import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';

export class ClassDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  code: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  course: string;

  @Expose()
  @ApiProperty()
  paralelo: string;

  @Expose()
  @ApiProperty()
  academicPeriod: string;

  @Expose()
  @ApiProperty()
  description: string;

  @Expose()
  @ApiProperty()
  isPublic: boolean;
}

export class CreateClassDto {
  @IsString({ message: 'El nombre debe ser un string' })
  @ApiProperty()
  name: string;

  @IsString({ message: 'El periodo académico debe ser un string' })
  @ApiProperty()
  academicPeriod: string;

  @IsString({ message: 'El nivel debe ser un string' })
  @ApiProperty()
  level: string;

  @IsString({ message: 'El paralelo debe ser un string' })
  @ApiProperty()
  paralelo: string;

  @IsString({ message: 'El paralelo debe ser un string' })
  @ApiProperty()
  carrera: string;

  @IsString({ message: 'La descripción debe ser un string' })
  @ApiProperty()
  description: string;

  @IsBoolean({ message: 'El estado debe ser un booleano' })
  @ApiProperty()
  isPublic: boolean;
}

export class UpdateClassDto extends PartialType(CreateClassDto) {}
