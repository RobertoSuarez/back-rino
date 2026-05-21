import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { GeminiService } from '../../services/gemini/gemini.service';
import { AuthGuard } from '../../../user/guards/auth/auth.guard';

class GenerateCourseDescriptionDto {
  @IsString()
  @IsNotEmpty()
  title: string;
}

class GenerateChapterDescriptionDto {
  @IsString()
  @IsNotEmpty()
  chapterTitle: string;

  @IsString()
  @IsNotEmpty()
  courseTitle: string;

  @IsString()
  @IsNotEmpty()
  courseDescription: string;
}

class GenerateTemaContentDto {
  @IsString()
  @IsNotEmpty()
  temaTitle: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  topicTitle?: string;

  @IsString()
  @IsNotEmpty()
  chapterTitle: string;

  @IsString()
  @IsNotEmpty()
  courseTitle: string;
}

class GenerateTheoryWithPromptDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsString()
  @IsNotEmpty()
  temaTitle: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  topicTitle?: string;

  @IsString()
  @IsNotEmpty()
  chapterTitle: string;

  @IsString()
  @IsNotEmpty()
  courseTitle: string;
}

class GenerateCourseDescriptionWithPromptDto {
  @IsString()
  @IsNotEmpty()
  courseTitle: string;

  @IsString()
  @IsNotEmpty()
  prompt: string;
}

class GenerateChapterDescriptionWithPromptDto {
  @IsString()
  @IsNotEmpty()
  chapterTitle: string;

  @IsString()
  @IsNotEmpty()
  courseTitle: string;

  @IsString()
  @IsNotEmpty()
  courseDescription: string;

  @IsString()
  @IsNotEmpty()
  prompt: string;
}

class GenerateTemaDescriptionWithPromptDto {
  @IsString()
  @IsNotEmpty()
  temaTitle: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  topicTitle?: string;

  @IsString()
  @IsNotEmpty()
  chapterTitle: string;

  @IsString()
  @IsNotEmpty()
  courseTitle: string;

  @IsString()
  @IsNotEmpty()
  prompt: string;
}

@Controller('ai')
@UseGuards(AuthGuard)
export class GeminiController {
  constructor(private geminiService: GeminiService) {}

  private resolveTemaTitle(payload: {
    temaTitle?: string;
    title?: string;
    topicTitle?: string;
  }): string | undefined {
    return payload.temaTitle ?? payload.title ?? payload.topicTitle;
  }

  @Post('generate-course-description')
  async generateCourseDescription(@Body() payload: any) {
    const description = await this.geminiService.generateCourseDescription(
      payload.title,
    );
    return { description };
  }

  @Post('generate-chapter-description')
  async generateChapterDescription(@Body() payload: any) {
    const description = await this.geminiService.generateChapterDescription(
      payload.chapterTitle,
      payload.courseTitle,
      payload.courseDescription,
    );
    return { description };
  }

  @Post('generate-tema-content')
  async generateTemaContent(@Body() payload: any) {
    const content = await this.geminiService.generateTemaContent(
      this.resolveTemaTitle(payload),
      payload.chapterTitle,
      payload.courseTitle,
    );
    return content;
  }

  @Post('generate-theory-with-prompt')
  async generateTheoryWithPrompt(@Body() payload: GenerateTheoryWithPromptDto) {
    const theory = await this.geminiService.generateTheoryWithPrompt(
      payload.prompt,
      this.resolveTemaTitle(payload),
      payload.chapterTitle,
      payload.courseTitle,
    );

    return { theory };
  }

  @Post('generate-course-description-with-prompt')
  async generateCourseDescriptionWithPrompt(@Body() payload: GenerateCourseDescriptionWithPromptDto) {
    const description = await this.geminiService.generateCourseDescriptionWithPrompt(
      payload.courseTitle,
      payload.prompt,
    );
    return { description };
  }

  @Post('generate-chapter-description-with-prompt')
  async generateChapterDescriptionWithPrompt(@Body() payload: GenerateChapterDescriptionWithPromptDto) {
    const description = await this.geminiService.generateChapterDescriptionWithPrompt(
      payload.chapterTitle,
      payload.courseTitle,
      payload.courseDescription,
      payload.prompt,
    );
    return { description };
  }

  @Post('generate-tema-description-with-prompt')
  async generateTemaDescriptionWithPrompt(@Body() payload: GenerateTemaDescriptionWithPromptDto) {
    const description = await this.geminiService.generateTemaDescriptionWithPrompt(
      this.resolveTemaTitle(payload),
      payload.chapterTitle,
      payload.courseTitle,
      payload.prompt,
    );
    return { description };
  }
  @Post('suggest-titles')
  async suggestTitles(@Body() payload: { topic: string }) {
    const titles = await this.geminiService.suggestCourseTitles(payload.topic);
    return { titles };
  }

  @Post('suggest-chapters')
  async suggestChapters(@Body() payload: { courseTitle: string, existingChapters: string[] }) {
    const chapters = await this.geminiService.suggestChapters(payload.courseTitle, payload.existingChapters);
    return { chapters };
  }

  @Post('generate-full-structure')
  async generateFullStructure(@Body() payload: { title: string, context?: string }) {
    return await this.geminiService.generateFullCourseStructure(
      payload.title,
      payload.context,
    );
  }
}
