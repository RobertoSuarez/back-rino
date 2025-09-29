import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateQuestionDto {
  @IsNumber()
  assessmentId: number;

  @IsString()
  statement: string;

  @IsString({ message: 'La dificultad debe ser un string' })
  @IsEnum(['Fácil', 'Medio', 'Difícil'])
  @ApiProperty()
  difficulty: string;

  @IsString()
  @IsOptional()
  code: string;

  @IsString()
  @IsOptional()
  hind: string;

  @IsEnum([
    'selection_single',
    'selection_multiple',
    'order_fragment_code',
    'order_line_code',
    'write_code',
    'find_error_code',
    'vertical_ordering',
    'horizontal_ordering',
    'phishing_selection_multiple',
    'match_pairs'
  ])
  typeQuestion:
    | 'selection_single'
    | 'selection_multiple'
    | 'order_fragment_code' // VARIAS LINEAS
    | 'order_line_code' // DE SOLO UNA LINEA
    | 'write_code'
    | 'find_error_code'
    | 'vertical_ordering'
    | 'horizontal_ordering'
    | 'phishing_selection_multiple'
    | 'match_pairs';

  @IsArray()
  @IsOptional()
  optionSelectOptions: string[];

  @IsArray()
  @IsOptional()
  optionOrderFragmentCode: string[];

  @IsArray()
  @IsOptional()
  optionOrderLineCode: string[];

  @IsArray()
  @IsOptional()
  optionsFindErrorCode: string[];

  @IsArray()
  @IsOptional()
  verticalOrdering: string[];

  @IsArray()
  @IsOptional()
  horizontalOrdering: string[];

  @IsArray()
  @IsOptional()
  phishingSelectionMultiple: string[];

  @IsArray()
  @IsOptional()
  matchPairs: string[];

  // Los siguientes campos son las respuestas de las diferentes preguntas.
  @IsString()
  @IsOptional()
  answerSelectCorrect: string;

  @IsArray()
  @IsOptional()
  answerSelectsCorrect: string[];

  @IsArray()
  @IsOptional()
  answerOrderFragmentCode: string[];

  @IsArray()
  @IsOptional()
  answerOrderLineCode: string[];

  @IsString()
  @IsOptional()
  answerFindError: string;
}

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {}

// Respuesta del usuario de una pregunta
export class ResponseUserQuestionDto {
  @IsString()
  @IsOptional()
  answerSelect: string;

  @IsArray()
  @IsOptional()
  answerSelects: string[];

  @IsArray()
  @IsOptional()
  answerOrderFragmentCode: string[];

  @IsArray()
  @IsOptional()
  answerOrderLineCode: string[];

  @IsString()
  @IsOptional()
  answerFindError: string;

  @IsString()
  @IsOptional()
  answerCode: string;
}
