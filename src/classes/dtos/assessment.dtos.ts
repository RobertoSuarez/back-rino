import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString } from 'class-validator';

export class CreateAssessmentDto {
  @IsNumber()
  classId: number;

  @IsString()
  title: string;

  @IsString()
  started: string;

  @IsString()
  finished: string;

  @IsString()
  timeLimit: string;

  @IsString()
  @IsEnum(['Teórica', 'Teórica/Práctica'])
  contentFocus: string;

  @IsString()
  @IsEnum(['FORMATIVA', 'SUMATIVA'])
  typeAssessment: string;

  @IsNumber()
  amountOfAttempt: number;

  @IsNumber()
  numberOfQuestions: number;
}

export class UpdateAssessmentDto extends PartialType(CreateAssessmentDto) {}
