import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsArray, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class GenerateExercisesWithPromptDto {
  @IsString()
  @ApiProperty({ 
    description: 'Prompt personalizado del usuario',
    example: 'Genera ejercicios sobre phishing y cómo identificar emails sospechosos'
  })
  prompt: string;

  @IsEnum(['Fácil', 'Medio', 'Difícil'])
  @ApiProperty({ 
    description: 'Dificultad de los ejercicios',
    enum: ['Fácil', 'Medio', 'Difícil'],
    example: 'Medio'
  })
  difficulty: 'Fácil' | 'Medio' | 'Difícil';

  @IsNumber()
  @Min(1)
  @Max(10)
  @ApiProperty({ 
    description: 'Cantidad de ejercicios a generar (1-10)',
    example: 5
  })
  quantity: number;

  @IsOptional()
  @IsArray()
  @IsEnum([
    'selection_single',
    'selection_multiple',
    'vertical_ordering',
    'horizontal_ordering',
    'phishing_selection_multiple',
    'match_pairs'
  ], { each: true })
  @ApiProperty({ 
    description: 'Tipos de ejercicios a generar (si está vacío, genera todos)',
    example: ['selection_single', 'match_pairs'],
    isArray: true
  })
  exerciseTypes?: string[];

  @IsOptional()
  @IsString()
  @ApiProperty({ 
    description: 'Contexto adicional (tema, capítulo, nivel)',
    example: 'Capítulo 2 - Seguridad en Email'
  })
  context?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ 
    description: 'Si es true, distribuye equitativamente entre tipos',
    example: true
  })
  balanceTypes?: boolean;
}

export class GeneratedExerciseDto {
  @ApiProperty({ description: 'ID temporal para identificar en frontend' })
  id: string;

  @ApiProperty({ description: 'Enunciado del ejercicio' })
  statement: string;

  @ApiProperty({ description: 'Dificultad del ejercicio' })
  difficulty: string;

  @ApiProperty({ description: 'Tipo de ejercicio' })
  typeExercise: string;

  @ApiProperty({ description: 'Opciones para selección (si aplica)', required: false })
  optionSelectOptions?: string[];

  @ApiProperty({ description: 'Opciones para ordenamiento de fragmentos (si aplica)', required: false })
  optionOrderFragmentCode?: string[];

  @ApiProperty({ description: 'Opciones para ordenamiento de líneas (si aplica)', required: false })
  optionOrderLineCode?: string[];

  @ApiProperty({ description: 'Opciones para encontrar errores (si aplica)', required: false })
  optionsFindErrorCode?: string[];

  @ApiProperty({ description: 'Respuesta correcta para selección simple (si aplica)', required: false })
  answerSelectCorrect?: string;

  @ApiProperty({ description: 'Respuestas correctas para selección múltiple (si aplica)', required: false })
  answerSelectsCorrect?: string[];

  @ApiProperty({ description: 'Respuesta para ordenamiento de fragmentos (si aplica)', required: false })
  answerOrderFragmentCode?: string[];

  @ApiProperty({ description: 'Respuesta para ordenamiento de líneas (si aplica)', required: false })
  answerOrderLineCode?: string[];

  @ApiProperty({ description: 'Respuesta para encontrar errores (si aplica)', required: false })
  answerFindError?: string;

  @ApiProperty({ description: 'Código para ejercicios de código (si aplica)', required: false })
  code?: string;

  @ApiProperty({ description: 'Pista para resolver el ejercicio (si aplica)', required: false })
  hint?: string;

  @ApiProperty({ description: 'Elementos de la izquierda para emparejamiento (si aplica)', required: false })
  leftItems?: string[];

  @ApiProperty({ description: 'Elementos de la derecha para emparejamiento (si aplica)', required: false })
  rightItems?: string[];

  @ApiProperty({ description: 'Pares correctos para emparejamiento (si aplica)', required: false })
  pairs?: Array<{ left: string; right: string }>;
}

export class GenerateExercisesResponseDto {
  @ApiProperty({ description: 'Cantidad de ejercicios generados' })
  count: number;

  @ApiProperty({ 
    description: 'Array de ejercicios generados',
    type: [GeneratedExerciseDto]
  })
  exercises: GeneratedExerciseDto[];

  @ApiProperty({ description: 'Tiempo de generación en milisegundos' })
  generationTime: number;
}
