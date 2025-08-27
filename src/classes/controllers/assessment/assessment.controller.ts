import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  CreateAssessmentDto,
  UpdateAssessmentDto,
} from '../../../classes/dtos/assessment.dtos';
import { ResponseUserQuestionDto } from '../../../classes/dtos/question.dtos';
import { AssessmentService } from '../../../classes/services/assessment/assessment.service';
import { AuthGuard } from '../../../user/guards/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('assessment')
export class AssessmentController {
  constructor(private _assessmentService: AssessmentService) {}

  @Get()
  async getAssessmentsByClassId(
    @Request() req,
    @Query('class_id', ParseIntPipe) classId: number,
    @Query('status') status: 'in_progress' | 'finished' | 'all',
  ) {
    const { id: userId } = req.user;
    return await this._assessmentService.getAssessmentsByClassId(
      classId,
      status,
      userId,
    );
  }

  @Get(':id')
  async getAssessmentById(@Param('id', ParseIntPipe) assessmentId: number) {
    return await this._assessmentService.getAssessmentById(assessmentId);
  }

  @Get(':id/status')
  async statusAssessment(@Param('id', ParseIntPipe) assessmentId: number) {
    return await this._assessmentService.statusAssessment(assessmentId);
  }

  @Get(':id/attempts')
  async getAssessmentsAttempted(
    @Param('id', ParseIntPipe) assessmentId: number,
    @Request() req,
  ) {
    const { id: userId } = req.user;
    return await this._assessmentService.getAssessmentsAttempted(
      assessmentId,
      userId,
    );
  }

  // comentarios
  @Get('assessment-of-user/:id/continue')
  async getAssessmentsOfUser(@Param('id', ParseIntPipe) assessmentId: number) {
    return await this._assessmentService.getAssessmentsOfUser(assessmentId);
  }

  @Get('review/:id_assessment_user')
  async getReviewAssessment(
    @Param('id_assessment_user', ParseIntPipe) assessmentId: number,
  ) {
    return await this._assessmentService.getReviewAssessment(assessmentId);
  }

  @Post()
  async createAssessment(@Body() body: CreateAssessmentDto) {
    return await this._assessmentService.createAssessment(body);
  }

  @Post(':id/init')
  async initAssessment(
    @Request() req,
    @Param('id', ParseIntPipe) assessmentId: number,
  ) {
    const { id: userId } = req.user;
    return await this._assessmentService.initAssessment(assessmentId, userId);
  }

  @Put(':id')
  async updateAssessment(
    @Param('id', ParseIntPipe) assessmentId: number,
    @Body() body: UpdateAssessmentDto,
  ) {
    return await this._assessmentService.updateAssessment(assessmentId, body);
  }

  @Patch('question/:id/response-student')
  async responseQuestion(
    @Param('id', ParseIntPipe) questionId: number,
    @Body() payload: ResponseUserQuestionDto,
  ) {
    return await this._assessmentService.responseQuestion(questionId, payload);
  }

  @Patch(':id/finish')
  async finishAssessment(@Param('id', ParseIntPipe) assessmentId: number) {
    // finaliza la evaluación del estudiante.
    return await this._assessmentService.finishAssessmentForStudent(
      assessmentId,
    );
  }

  @Delete(':id')
  async deleteAssessment(@Param('id', ParseIntPipe) assessmentId: number) {
    return await this._assessmentService.deleteAssessment(assessmentId);
  }
}
