import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class TemaForTeacherDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  title: string;

  @Expose()
  @ApiProperty()
  createdAt: string;

  @Expose()
  @ApiProperty()
  updatedAt: string;
}

export class TemaDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  title: string;

  @Expose()
  @ApiProperty()
  shortDescription: string;

  @Expose()
  @ApiProperty()
  theory: string;

  @Expose()
  @ApiProperty()
  urlBackground?: string;

  @Expose()
  @ApiProperty()
  index: number;

  @Expose()
  @ApiProperty()
  difficulty: string;
}

export class CreateTemaDto {
  @ApiProperty()
  @IsString({ message: 'El título debe ser un string' })
  @IsNotEmpty({ message: 'El título es requerido' })
  title: string;

  @ApiProperty()
  @IsString({ message: 'La descripción corta debe ser un string' })
  @IsNotEmpty({ message: 'La descripción corta es requerida' })
  shortDescription: string;

  @ApiProperty()
  @IsString({ message: 'La teoría debe ser un string' })
  @IsNotEmpty({ message: 'La teoría es requerida' })
  theory: string;

  @ApiProperty()
  @IsString({ message: 'La url del fondo debe ser un string' })
  urlBackground?: string;

  @IsString({ message: 'La dificultad debe ser un string' })
  @IsEnum(['Fácil', 'Medio', 'Difícil'])
  @ApiProperty()
  difficulty: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El capítulo es requerido' })
  @IsNumber()
  chapterId: number;
}

export class UpdateTemaDto extends PartialType(CreateTemaDto) {}
