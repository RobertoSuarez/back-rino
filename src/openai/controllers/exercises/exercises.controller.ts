import { Body, Controller, Post } from '@nestjs/common';
import { GenerateExerciseDto } from '../../../openai/dtos/exercise.dto';
import { GenerateExercisesService } from '../../../openai/services/generate-exercises/generate-exercises.service';

@Controller('openai/exercises')
export class ExercisesController {
  constructor(private generateExercisesService: GenerateExercisesService) {}

  @Post('generate')
  async generateExercises(@Body() payload: GenerateExerciseDto) {
    const result =
      await this.generateExercisesService.generateExercise(payload);

    return result;
  }
}
