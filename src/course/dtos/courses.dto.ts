import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CourseDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  title: string;

  @Expose()
  @ApiProperty()
  description: string;

  @Expose()
  @ApiProperty()
  code: string;

  @Expose()
  @ApiProperty()
  urlLogo?: string;

  @Expose()
  @ApiProperty()
  index: number;

  @Expose()
  @ApiProperty()
  isPublic: boolean;


  @Expose()
  @ApiProperty()
  createdBy: string;

  @Expose()
  @ApiProperty()
  createdAt: string;

  @Expose()
  @ApiProperty()
  updatedAt: string;
}

export class CreateCourseDto {
  @IsString({ message: 'El título debe ser un string' })
  @IsNotEmpty({ message: 'El título es requerido' })
  @ApiProperty()
  title: string;

  @IsString({ message: 'La descripción debe ser un string' })
  @ApiProperty()
  description: string;

  @IsString({ message: 'La url del logo debe ser un string' })
  @ApiProperty()
  urlLogo?: string;

  @IsBoolean({ message: 'El estado debe ser un booleano' })
  @ApiProperty()
  isPublic: boolean;
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}

export class CourseWithProgressDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  title: string;

  @Expose()
  @ApiProperty()
  urlLogo: string;

  @Expose()
  @ApiProperty()
  code: string;

  @Expose()
  @ApiProperty()
  chapters: number;

  @Expose()
  @ApiProperty()
  index: number;

  @Expose()
  @ApiProperty()
  progress: number;
}
