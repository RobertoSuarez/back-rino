import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import {
  ChapterDto,
  CreateChapterDto,
  UpdateChapterDto,
} from '../../../course/dtos/chapters.dtos';
import { ChaptersService } from '../../../course/services/chapters/chapters.service';
import { TemaService } from '../../../course/services/tema/tema.service';
import { ChaptersGPTService } from '../../../openai/services/chapters/chaptersGPT.service';
import { AuthGuard } from '../../../user/guards/auth/auth.guard';

@ApiTags('chapters')
@UseGuards(AuthGuard)
@Controller('chapters')
export class ChaptersController {
  constructor(
    private chaptersService: ChaptersService,
    private temaService: TemaService,
    private _chaptersGPTService: ChaptersGPTService,
  ) {}

  @ApiOperation({ summary: 'Obtiene los capítulos de un curso' })
  @ApiQuery({
    name: 'courseId',
    required: true,
    type: Number,
    description: 'Id del curso',
  })
  @Get()
  async getChaptersByCourseId(
    @Query('courseId', ParseIntPipe) courseId: number,
    @Query('difficulty') difficulty: string,
  ) {
    return await this.chaptersService.findChaptersByCourseId(
      courseId,
      difficulty,
    );
  }

  @Get(':id')
  async getChapterById(@Param('id', ParseIntPipe) chapterId: number) {
    return await this.chaptersService.findChapterById(chapterId);
  }

  @Get(':id/temas/progress')
  async getTemasWithProgressByChapterId(
    @Request() req,
    @Param('id', ParseIntPipe) chapterId: number,
  ) {
    const { id: userId } = req.user;
    const result = this.temaService.findTemasWithActivityByIdChapterId(
      userId,
      chapterId,
    );
    return result;
  }

  @Post('generate-chapters-openai')
  async generateChapters(@Body() payload: any) {
    return await this._chaptersGPTService.getChapters(payload.prompt);
  }

  @Post()
  async createChapter(@Body() payload: CreateChapterDto) {
    const result = this.chaptersService.createCourse(payload);
    return plainToClass(ChapterDto, result, { excludeExtraneousValues: true });
  }

  @Post('multiples')
  async createMultipleChapters(
    @Body() payload: CreateChapterDto[],
    @Query('courseId', ParseIntPipe) courseId: number,
  ) {
    return await this.chaptersService.createMultipleChapters(courseId, payload);
  }

  @Post(':id/init')
  async initChapter(
    @Request() req,
    @Param('id', ParseIntPipe) chapterId: number,
  ) {
    const { id: userId } = req.user;
    const result = await this.chaptersService.initChapter(chapterId, userId);
    return result;
  }

  @Patch(':id')
  async updateChapter(
    @Param('id', ParseIntPipe) chapterId: number,
    @Body() payload: UpdateChapterDto,
  ) {
    const result = this.chaptersService.updateChapter(chapterId, payload);
    return plainToClass(ChapterDto, result, { excludeExtraneousValues: true });
  }

  @Delete(':id')
  async deleteChapter(@Param('id', ParseIntPipe) chapterId: number) {
    const result = this.chaptersService.deleteChapter(chapterId);
    return plainToClass(ChapterDto, result, { excludeExtraneousValues: true });
  }
}
