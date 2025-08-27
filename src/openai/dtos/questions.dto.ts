import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString } from 'class-validator';

export class GenerateQuestionDto {
  @IsString()
  @ApiProperty()
  prompt: string;

  @IsEnum(['Teórica', 'Teórica/Práctica'])
  contentFocus: 'Teórica' | 'Teórica/Práctica';

  @IsNumber()
  numberOfQuestions: number;
}
