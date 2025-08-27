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
    'order_fragment_code',
    'order_line_code',
    'write_code',
    'find_error_code',
  ])
  @ApiProperty()
  typeExercise: string;
}
