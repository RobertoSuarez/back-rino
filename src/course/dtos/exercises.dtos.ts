import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { DateTime } from 'luxon';
import { formatDateFrontend } from '../../common/constants';

export class CreateExercise {
  @Expose()
  @IsInt()
  @IsNotEmpty()
  @ApiProperty()
  activityId: number;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  statement: string;

  @Expose()
  @IsString()
  code: string;

  @IsString({ message: 'La dificultad debe ser un string' })
  @IsEnum(['Fácil', 'Medio', 'Difícil'])
  @ApiProperty()
  difficulty: string;

  @Expose()
  @IsString()
  @ApiProperty()
  hind: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
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
    'match_pairs',
  ])
  @ApiProperty()
  typeExercise: string;

  // Opciones para las diferentes preguntas.

  @Expose()
  @IsArray()
  @ApiProperty()
  optionSelectOptions: string[];

  @Expose()
  @IsArray()
  @ApiProperty()
  optionOrderFragmentCode: string[];

  @Expose()
  @IsArray()
  @ApiProperty()
  optionOrderLineCode: string[];

  @Expose()
  @IsArray()
  @ApiProperty()
  optionsFindErrorCode: string[];

  // Respuestas de las diferentes preguntas.
  @Expose()
  @IsString()
  @ApiProperty()
  answerSelectCorrect: string;

  @Expose()
  @IsArray()
  @ApiProperty()
  answerSelectsCorrect: string[];

  @Expose()
  @IsArray()
  @ApiProperty()
  answerOrderFragmentCode: string[];

  @Expose()
  @IsArray()
  @ApiProperty()
  answerOrderLineCode: string[];

  @Expose()
  @IsString()
  @ApiProperty()
  answerFindError: string;

  @Expose()
  @IsString()
  @ApiProperty()
  answerWriteCode: string;

  // Opciones y respuestas para vertical_ordering
  @Expose()
  @IsArray()
  @ApiProperty()
  optionsVerticalOrdering: string[];

  @Expose()
  @IsArray()
  @ApiProperty()
  answerVerticalOrdering: string[];

  // Opciones y respuestas para horizontal_ordering
  @Expose()
  @IsArray()
  @ApiProperty()
  optionsHorizontalOrdering: string[];

  @Expose()
  @IsArray()
  @ApiProperty()
  answerHorizontalOrdering: string[];

  // Opciones y respuestas para phishing_selection_multiple
  @Expose()
  @IsArray()
  @ApiProperty()
  optionsPhishingSelection: string[];

  @Expose()
  @IsArray()
  @ApiProperty()
  answerPhishingSelection: string[];

  @Expose()
  @IsString()
  @ApiProperty()
  phishingContext: string;

  @Expose()
  @IsString()
  @ApiProperty()
  phishingImageUrl: string;

  // Opciones y respuestas para match_pairs
  @Expose()
  @IsArray()
  @ApiProperty()
  optionsMatchPairsLeft: string[];

  @Expose()
  @IsArray()
  @ApiProperty()
  optionsMatchPairsRight: string[];

  @Expose()
  @IsArray()
  @ApiProperty()
  answerMatchPairs: { left: string; right: string }[];
}

export class UpdateExercise extends PartialType(CreateExercise) {
  // Respuestas de las diferentes preguntas.
  // @IsString()
  // answerSelectCorrect: string;
  // @IsArray()
  // answerSelectsCorrect: string[];
  // @IsArray()
  // answerCompleteToCode: string[];
  // @IsArray()
  // answerOrderCode: string[];
  // @IsArray()
  // answerFindError: string;
}

export class CheckExerciseDto {
  // ID del usuario que responde
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  userId: number;

  // Respuestas de las diferentes preguntas.

  @ApiProperty()
  @IsString()
  answerSelect: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  answerSelects: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  answerOrderFragmentCode: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  answerOrderLineCode: string[];

  @ApiProperty()
  @IsString()
  answerWriteCode: string;

  @ApiProperty()
  @IsString()
  answerFindError: string;
}

/**
 * DTO que devuelve la calificación y el feedback de la evaluación de un ejercicio.
 */
export class FeedbackExerciseDto {
  /**
   * Calificación del alumno en el ejercicio.
   */
  @ApiProperty({ description: 'Calificación del alumno en el ejercicio.' })
  @Expose()
  @IsNumber()
  qualification: number;

  /**
   * Feedback de la evaluación del ejercicio.
   */
  @ApiProperty({ description: 'Feedback de la evaluación del ejercicio.' })
  @Expose()
  @IsString()
  feedback: string;

  /**
   * Yachay ganado por completar el ejercicio correctamente.
   */
  @ApiProperty({ description: 'Yachay ganado por completar el ejercicio.' })
  @Expose()
  @IsNumber()
  yachayEarned?: number;

  /**
   * Dificultad del ejercicio.
   */
  @ApiProperty({ description: 'Dificultad del ejercicio.' })
  @Expose()
  @IsString()
  difficulty?: string;
}

export class ExerciseForTeacher {
  @ApiProperty({ description: 'Identificador del ejercicio.' })
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Tipo de pregunta.' })
  @Expose()
  @IsString()
  typeQuestion: string;

  @ApiProperty({ description: 'Enunciado del ejercicio.' })
  @Expose()
  @IsString()
  statement: string;

  @ApiProperty({
    description: 'Fecha de creación del ejercicio.',
    format: 'date-time',
  })
  @Expose()
  @Transform(({ value }) =>
    DateTime.fromISO(value.toISOString()).toFormat(formatDateFrontend),
  )
  createdAt: string;

  @ApiProperty({
    description: 'Última fecha de actualización del ejercicio.',
    format: 'date-time',
  })
  @Expose()
  @Transform(({ value }) =>
    DateTime.fromISO(value.toISOString()).toFormat(formatDateFrontend),
  )
  updatedAt: string;
}

export class ExerciseDto {
  // Campos comunes.
  @ApiProperty({ description: 'Identificador del ejercicio.' })
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Enunciado del ejercicio.' })
  @Expose()
  @IsString()
  statement: string;

  @ApiProperty({ description: 'Tipo de pregunta.' })
  @Expose()
  @IsString()
  typeQuestion: string;

  @ApiProperty({
    description: 'Modo de respuesta para las opciones de selección múltiple',
  })
  @Expose()
  @IsString()
  optionSelectMode: string;

  // Opciones para las diferentes preguntas.

  @ApiProperty({
    description: 'Opciones para la selección múltiple.',
    isArray: true,
    type: String,
  })
  @Expose()
  @IsArray()
  @IsString({ each: true })
  optionSelectOptions: string[];

  @ApiProperty({
    description: 'Opciones para completar el código.',
    isArray: true,
    type: String,
  })
  @Expose()
  @IsArray()
  @IsString({ each: true })
  optionCompleteToCode: string[];

  @ApiProperty({
    description: 'Opciones para ordenar el código.',
    isArray: true,
    type: String,
  })
  @Expose()
  @IsArray()
  @IsString({ each: true })
  optionOrderCode: string[];

  @ApiProperty({
    description: 'Opciones para encontrar error en el código.',
    isArray: true,
    type: String,
  })
  @Expose()
  @IsArray()
  @IsString({ each: true })
  optionsFindError: string[];

  // Respuestas de las diferentes preguntas.
  @ApiProperty({
    description: 'Respuesta correcta para la selección simple.',
  })
  @Expose()
  @IsString()
  answerSelectCorrect: string;

  @ApiProperty({
    description: 'Respuestas correctas para la selección múltiple.',
    isArray: true,
    type: String,
  })
  @Expose()
  @IsArray()
  @IsString({ each: true })
  answerSelectsCorrect: string[];

  @ApiProperty({
    description: 'Respuesta correcta para completar el código.',
    isArray: true,
    type: String,
  })
  @Expose()
  @IsArray()
  @IsString({ each: true })
  answerCompleteToCode: string[];

  @ApiProperty({
    description: 'Respuesta correcta para ordenar el código.',
    isArray: true,
    type: String,
  })
  @Expose()
  @IsArray()
  @IsString({ each: true })
  answerOrderCode: string[];

  @ApiProperty({
    description: 'Respuesta correcta para encontrar error en el código.',
    isArray: true,
    type: String,
  })
  @Expose()
  @IsArray()
  @IsString({ each: true })
  answerFindError: string[];
}
