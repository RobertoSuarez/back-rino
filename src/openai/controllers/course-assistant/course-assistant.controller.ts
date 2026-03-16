import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CourseAssistantService } from '../../services/course-assistant/course-assistant.service';
import { 
  SuggestTitlesDto, 
  GenerateChaptersDto, 
  GenerateTopicsDto, 
  GenerateExerciseSetDto 
} from '../../dtos/course-assistant.dto';
import { AuthGuard } from '../../../user/guards/auth/auth.guard';

@ApiTags('OpenAI - Course Assistant')
@Controller('openai/course-assistant')
@UseGuards(AuthGuard)
export class CourseAssistantController {
  constructor(private readonly courseAssistantService: CourseAssistantService) {}

  @Post('suggest-titles')
  @ApiOperation({ summary: 'Sugiere títulos creativos para un curso' })
  @ApiResponse({ status: 200, description: 'Lista de títulos sugeridos' })
  async suggestTitles(@Body() payload: SuggestTitlesDto) {
    return this.courseAssistantService.suggestCourseTitles(payload.idea);
  }

  @Post('generate-chapters')
  @ApiOperation({ summary: 'Genera estructura de capítulos para un curso' })
  async generateChapters(@Body() payload: GenerateChaptersDto) {
    return this.courseAssistantService.generateChapters(payload.courseTitle);
  }

  @Post('generate-topics')
  @ApiOperation({ summary: 'Genera temas para un capítulo' })
  async generateTopics(@Body() payload: GenerateTopicsDto) {
    return this.courseAssistantService.generateTopics(payload.courseTitle, payload.chapterTitle);
  }

  @Post('generate-exercises')
  @ApiOperation({ summary: 'Genera un conjunto de ejercicios para un tema' })
  async generateExercises(@Body() payload: GenerateExerciseSetDto) {
    return this.courseAssistantService.generateExerciseSet(
        payload.topicTitle, 
        payload.quantity, 
        payload.difficulty
    );
  }
}
