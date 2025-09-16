import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import {
  CourseDto,
  CreateCourseDto,
  UpdateCourseDto,
} from '../../../course/dtos/courses.dto';
import { CoursesService } from '../../../course/services/courses/courses.service';
import { GenerateImageService } from '../../../openai/services/generate-image/generate-image.service';
import { AuthGuard } from '../../../user/guards/auth/auth.guard';
import { DateTime } from 'luxon';
import { formatDateFrontend } from 'src/common/constants';

@ApiTags('courses')
@Controller('courses')
@UseGuards(AuthGuard)
export class CoursesController {
  constructor(
    private coursesService: CoursesService,
    private _generateImageService: GenerateImageService,
  ) {}

  @ApiOperation({ summary: 'Obtiene todos los cursos que están públicos' })
  @Get()
  async getCourses() {
    return await this.coursesService.findAll();
  }

  @ApiOperation({
    summary: 'Recupera todos los cursos pero con el progreso del usuario',
  })
  @ApiQuery({
    name: 'completed',
    required: true,
    type: Boolean,
    description: 'Filtra los cursos completados, por defecto es false',
  })
  @Get('progress')
  async findUserCourses(
    @Request() req,
    @Query('completed', ParseBoolPipe) completed = false,
  ) {
    const { id } = req.user;
    const result = await this.coursesService.findCourseWithProgress(
      id,
      completed,
    );
    // const result = await this.courseService.findMySubscriptionsCourses(id);
    return result;
  }

  @ApiOperation({
    summary:
      'Obtiene todos los cursos de un usuario, se utiliza para el perfil de profesor',
  })
  @Get('created-by-me')
  async findCourseForTeacher(@Request() req) {
    const { id } = req.user;
    const result = await this.coursesService.findCourseForTeacher(id);
    return result;
  }

  @ApiOperation({
    summary: 'Obtenie todos los cursos suscrito de un usuario con el progreso',
  })
  @Get('subscriptions')
  async findMySubscriptionsCourses(@Request() req) {
    const { id } = req.user;
    const result = await this.coursesService.findMySubscriptionsCourses(id);
    return result;
  }

  @Get(':id')
  async getCourseByID(@Param('id', ParseIntPipe) courseId: number) {
    const course = await this.coursesService.findCourseById(courseId);
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      code: course.code,
      urlLogo: course.urlLogo,
      index: course.index,
      isPublic: course.isPublic,
      createdBy: course.createdBy.firstName + ' ' + course.createdBy.lastName,
      updatedAt: DateTime.fromISO(course.updatedAt.toISOString())
        .setZone('America/Guayaquil')
        .toFormat("dd-MMM-yyyy"),
    };
  }

  @ApiOperation({ summary: 'Crea un curso y registra quien lo creo.' })
  @Post()
  async createCourse(@Request() req, @Body() payload: CreateCourseDto) {
    const { id } = req.user;
    const course = await this.coursesService.createCourse(id, payload);
    return {
      id: course.id,
    };
  }

  @ApiOperation({ summary: 'Actualiza un curso por el id' })
  @Patch(':id')
  async updateCourse(
    @Request() req,
    @Param('id', ParseIntPipe) courseId: number,
    @Body() payload: UpdateCourseDto,
  ) {
    const { id: userId } = req.user;
    const result = await this.coursesService.updateCourse(
      userId,
      courseId,
      payload,
    );
    return plainToClass(CourseDto, result, { excludeExtraneousValues: true });
  }

  @ApiOperation({
    summary: '',
  })
  @Delete(':id')
  async deleteCourse(
    @Request() req,
    @Param('id', ParseIntPipe) courseId: number,
  ) {
    const { id: userId } = req.user;
    const result = await this.coursesService.deleteCourse(userId, courseId);
    return plainToClass(CourseDto, result, { excludeExtraneousValues: true });
  }

  @ApiOperation({
    summary: 'Obtiene los capítulos de un curso con el progreso del usuario',
  })
  @Get(':id/chapters/progress')
  async getChaptersProgress(
    @Request() req,
    @Param('id', ParseIntPipe) courseId: number,
  ) {
    const { id } = req.user;
    const result = await this.coursesService.findMyChapterWithProgress(
      id,
      courseId,
    );
    return result;
  }

  @ApiOperation({
    summary: 'Sube imagenes y retorna la URL de las mismas',
  })
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this._generateImageService.uploadImage(file);
    return {
      url,
    };
  }
}
