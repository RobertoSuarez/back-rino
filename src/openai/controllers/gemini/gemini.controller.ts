import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { GeminiService } from '../../services/gemini/gemini.service';
import { AuthGuard } from '../../../user/guards/auth/auth.guard';

class GenerateCourseDescriptionDto {
  title: string;
}

class GenerateChapterDescriptionDto {
  chapterTitle: string;
  courseTitle: string;
  courseDescription: string;
}

class GenerateTemaContentDto {
  temaTitle: string;
  chapterTitle: string;
  courseTitle: string;
}

@Controller('ai')
@UseGuards(AuthGuard)
export class GeminiController {
  constructor(private geminiService: GeminiService) {}

  @Post('generate-course-description')
  async generateCourseDescription(@Body() payload: any) {
    console.log('Payload', payload);
    const description = await this.geminiService.generateCourseDescription(
      payload.title,
    );
    return { description };
  }

  @Post('generate-chapter-description')
  async generateChapterDescription(@Body() payload: any) {
    console.log('Payload', payload);
    const description = await this.geminiService.generateChapterDescription(
      payload.chapterTitle,
      payload.courseTitle,
      payload.courseDescription,
    );
    return { description };
  }

  @Post('generate-tema-content')
  async generateTemaContent(@Body() payload: any) {
    console.log('Payload', payload);
    const content = await this.geminiService.generateTemaContent(
      payload.temaTitle,
      payload.chapterTitle,
      payload.courseTitle,
    );
    return content;
  }
}
