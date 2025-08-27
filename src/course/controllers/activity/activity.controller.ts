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
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  CreateActivityDto,
  UpdateActivityDto,
} from '../../../course/dtos/activity.dtos';
import { FeedbackExerciseDto } from '../../../course/dtos/exercises.dtos';
import { ActivityService } from '../../../course/services/activity/activity.service';
import { AuthGuard } from '../../../user/guards/auth/auth.guard';

@Controller('activity')
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get()
  async findActivitiesByTema(@Query('temaId', ParseIntPipe) temaId: number) {
    return await this.activityService.findActivityByTemaID(temaId);
  }

  @Get(':id')
  async findActivityByID(@Param('id', ParseIntPipe) id: number) {
    return await this.activityService.findActivityByID(id);
  }

  @Get(':id/init')
  async initActivity(@Param('id', ParseIntPipe) id: number) {
    console.log(id);
    const result = await this.activityService.getActivityWithExercise(id);
    return result;
  }

  @UseGuards(AuthGuard)
  @Post(':id/finish')
  async finishActivity(
    @Request() req,
    @Param('id', ParseIntPipe) activityId: number,
    @Body() payload: FeedbackExerciseDto[],
  ) {
    const { id: userId } = req.user;
    const result = await this.activityService.finishActivity(
      activityId,
      userId,
      payload,
    );
    return result;
  }

  @Post()
  async createActivity(@Body() payload: CreateActivityDto) {
    const activityCreated = await this.activityService.createActivity(payload);
    return activityCreated;
  }

  @Put(':id')
  async updateActivityById(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateActivityDto,
  ) {
    const activityUpdated = await this.activityService.updateActivityById(
      id,
      payload,
    );
    return activityUpdated;
  }

  @Delete(':id')
  async deleteActivityById(@Param('id', ParseIntPipe) id: number) {
    return await this.activityService.deleteActivityById(id);
  }
}
