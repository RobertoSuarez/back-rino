import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SuggestTitlesDto {
  @ApiProperty({ description: 'Idea inicial o nombre del curso' })
  @IsString()
  @IsNotEmpty()
  idea: string;
}

export class GenerateChaptersDto {
  @ApiProperty({ description: 'Título del curso elegido' })
  @IsString()
  @IsNotEmpty()
  courseTitle: string;
}

export class GenerateTopicsDto {
  @ApiProperty({ description: 'Título del capítulo' })
  @IsString()
  @IsNotEmpty()
  chapterTitle: string;

  @ApiProperty({ description: 'Título del curso' })
  @IsString()
  @IsNotEmpty()
  courseTitle: string;
}

export class GenerateExerciseSetDto {
  @ApiProperty({ description: 'Título del tema' })
  @IsString()
  @IsNotEmpty()
  topicTitle: string;

  @ApiProperty({ description: 'Cantidad de ejercicios a generar' })
  @IsNumber()
  @IsOptional()
  quantity?: number = 3;

  @ApiProperty({ description: 'Dificultad (Fácil, Medio, Difícil)' })
  @IsString()
  @IsOptional()
  difficulty?: string = 'Medio';
}
