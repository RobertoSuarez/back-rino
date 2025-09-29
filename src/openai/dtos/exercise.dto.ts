import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class GenerateExerciseDto {
  @IsString()
  @ApiProperty()
  prompt: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum([
    'selection_single',
    'selection_multiple',
    'order_fragment_code', // esto hay que quitar
    'order_line_code', // esto hay que quitar
    'write_code', // esto hay que quitar
    'find_error_code', // esto hay que quitar
    'vertical_ordering', 
    'horizontal_ordering',
    'phishing_selection_multiple',
    'match_pairs'
  ])
  @ApiProperty()
  typeExercise: string;
}
