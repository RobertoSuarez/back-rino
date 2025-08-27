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
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  CheckExerciseDto,
  CreateExercise,
  ExerciseDto,
  UpdateExercise,
} from '../../../course/dtos/exercises.dtos';
import { ExercisesService } from '../../../course/services/exercises/exercises.service';

@ApiTags('Exercises')
@Controller('exercises')
export class ExercisesController {
  constructor(private exercisesService: ExercisesService) {}

  @Get()
  /**
   * Returns an array of exercises for the given theme id
   * @param temaId ID of the theme
   * @returns Array of exercises
   */
  @Get()
  @ApiOkResponse({
    description: 'Array of exercises',
    type: [ExerciseDto],
  })
  @ApiQuery({
    name: 'temaId',
    required: true,
    description: 'ID of the theme',
    type: 'integer',
  })
  async getExercises(
    @Query('temaId', ParseIntPipe)
    temaId: number,
    @Query('activity')
    activity: string,
  ) {
    return await this.exercisesService.getExercises(temaId, activity);
  }

  @Get('practice')
  async getPracticeExercises(
    @Query('chapterId', ParseIntPipe) chapterId: number,
  ) {
    return await this.exercisesService.getExercisesPractice(chapterId);
  }

  @Get(':id')
  async getExerciseById(@Param('id', ParseIntPipe) id: number) {
    return await this.exercisesService.getExerciseById(id);
  }

  @Delete(':id')
  async deleteExerciseById(@Param('id', ParseIntPipe) id: number) {
    return await this.exercisesService.deleteExerciseById(id);
  }

  /**
   * Creates a new exercise
   * @param payload Data of the exercise to create
   * @returns The created exercise
   */
  @Post()
  @ApiOkResponse({
    description: 'The created exercise',
    type: ExerciseDto,
  })
  @ApiBody({
    description: 'Data of the exercise to create',
    type: CreateExercise,
  })
  createExercise(@Body() payload: CreateExercise) {
    return this.exercisesService.createExercise(payload);
  }

  @Put(':id')
  async updateExercise(
    @Param('id', ParseIntPipe) id,
    @Body() payload: UpdateExercise,
  ) {
    return await this.exercisesService.updateExercise(id, payload);
  }

  @Post(':id/feedback')
  async getFeedback(
    @Param('id', ParseIntPipe) id,
    @Body() payload: CheckExerciseDto,
  ) {
    const result = await this.exercisesService.checkAnswer(id, payload);
    return result;
  }
}
