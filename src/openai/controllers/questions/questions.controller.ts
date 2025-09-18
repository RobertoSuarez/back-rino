import { Body, Controller, Post } from '@nestjs/common';
import { GenerateExercisesService } from '../../services/generate-exercises/generate-exercises.service';
import { GenerateQuestionDto } from 'src/openai/dtos/questions.dto';

@Controller('openai/questions')
export class QuestionsController {
  constructor(private generateExercisesService: GenerateExercisesService) {}

  @Post('generate')
  async generateQuestion(@Body() payload: GenerateQuestionDto) {
    return await this.generateExercisesService.generateQuestion(payload);
  }
}
