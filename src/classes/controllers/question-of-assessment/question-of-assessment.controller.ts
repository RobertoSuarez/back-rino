import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
} from '../../../classes/dtos/question.dtos';
import { QuestionOfAssessmentService } from '../../../classes/services/question-of-assessment/question-of-assessment.service';
import { AuthGuard } from '../../../user/guards/auth/auth.guard';

@ApiTags('question-of-assessment')
@Controller('question-of-assessment')
@UseGuards(AuthGuard)
export class QuestionOfAssessmentController {
  constructor(
    private _questionOfAssessmentService: QuestionOfAssessmentService,
  ) {}

  @Get()
  async getQuestionsByIdAssessment(
    @Query('assessmentId') assessmentId: number,
  ) {
    return await this._questionOfAssessmentService.getQuestionsByIdAssessment(
      assessmentId,
    );
  }

  @Post()
  async createQuestion(@Body() payload: CreateQuestionDto) {
    console.log(payload);
    return await this._questionOfAssessmentService.CreateQuestion(payload);
  }

  @Post('massive/:assessmentId')
  async createQuestionMassive(
    @Body() payload: CreateQuestionDto[],
    @Param('assessmentId') assessmentId: number,
  ) {
    return await this._questionOfAssessmentService.CreateQuestionMassive(
      assessmentId,
      payload,
    );
  }

  @Put(':id')
  async updateQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateQuestionDto,
  ) {
    return await this._questionOfAssessmentService.updateQuestion(id, payload);
  }

  @Delete(':id')
  async deleteQuestion(@Param('id') id: number) {
    return await this._questionOfAssessmentService.deleteQuestion(id);
  }
}
