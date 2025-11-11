import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GenerateExerciseDto } from '../../../openai/dtos/exercise.dto';
import { GenerateExercisesWithPromptDto } from '../../../openai/dtos/exercise-generation.dto';
import { GenerateExercisesService } from '../../../openai/services/generate-exercises/generate-exercises.service';

@ApiTags('Exercises')
@Controller('openai/exercises')
export class ExercisesController {
  constructor(private generateExercisesService: GenerateExercisesService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generar un ejercicio individual' })
  async generateExercises(@Body() payload: GenerateExerciseDto) {
    const result =
      await this.generateExercisesService.generateExercise(payload);

    return result;
  }

  @Post('generate-with-prompt')
  @ApiOperation({ summary: 'Generar múltiples ejercicios con prompt personalizado' })
  async generateExercisesWithPrompt(@Body() payload: GenerateExercisesWithPromptDto) {
    return await this.generateExercisesService.generateExercisesWithPrompt(payload);
  }
}
