import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminStatisticsService } from '../../service/admin-statistics/admin-statistics.service';
import { AuthGuard } from 'src/user/guards/auth/auth.guard';
import { RolesGuard } from 'src/user/guards/roles/roles.guard';
import { Roles } from 'src/user/decorators/roles.decorator';

@Controller('admin/statistics')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class AdminStatisticsController {
  constructor(private _adminStatisticsService: AdminStatisticsService) {}

  @Get('dashboard')
  async getDashboardStats() {
    return await this._adminStatisticsService.getDashboardStats();
  }

  @Get('users')
  async getUsersStats() {
    return await this._adminStatisticsService.getUsersStats();
  }

  @Get('users/growth')
  async getUsersGrowth(@Query('period') period: string = 'monthly') {
    return await this._adminStatisticsService.getUsersGrowth(period);
  }

  @Get('users/active')
  async getActiveUsers(@Query('period') period: string = 'monthly') {
    return await this._adminStatisticsService.getActiveUsers(period);
  }

  @Get('users/demographics')
  async getUsersDemographics() {
    return await this._adminStatisticsService.getUsersDemographics();
  }

  @Get('courses')
  async getCoursesStats() {
    return await this._adminStatisticsService.getCoursesStats();
  }

  @Get('courses/popular')
  async getPopularCourses() {
    return await this._adminStatisticsService.getPopularCourses();
  }

  @Get('courses/completion')
  async getCoursesCompletion() {
    return await this._adminStatisticsService.getCoursesCompletion();
  }

  @Get('performance/average-scores')
  async getAverageScores() {
    return await this._adminStatisticsService.getAverageScores();
  }

  @Get('performance/student-progress')
  async getStudentProgress() {
    return await this._adminStatisticsService.getStudentProgress();
  }

  @Get('performance/activities-success')
  async getActivitiesSuccess() {
    return await this._adminStatisticsService.getActivitiesSuccess();
  }

  @Get('engagement/access-frequency')
  async getAccessFrequency() {
    return await this._adminStatisticsService.getAccessFrequency();
  }

  @Get('engagement/resource-usage')
  async getResourceUsage() {
    return await this._adminStatisticsService.getResourceUsage();
  }

  @Get('temas/completion')
  async getTemasCompletion(@Query('period') period: string = 'monthly') {
    return await this._adminStatisticsService.getTemasCompletion(period);
  }
}
