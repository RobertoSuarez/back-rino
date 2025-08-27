import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class ChapterDto {
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
  index: number;

  @Expose()
  @ApiProperty()
  difficulty: number;
}

export class CreateChapterDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  courseId: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  title: string;

  @IsString()
  @ApiProperty()
  shortDescription: string;

  @IsString({ message: 'La dificultad debe ser un string' })
  @IsEnum(['Fácil', 'Medio', 'Difícil'])
  @ApiProperty()
  difficulty: string;
}

export class UpdateChapterDto extends PartialType(CreateChapterDto) {}
