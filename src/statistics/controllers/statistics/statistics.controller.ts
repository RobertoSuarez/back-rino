import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { StatisticsService } from '../../../statistics/service/statistics/statistics.service';
import { AuthGuard } from 'src/user/guards/auth/auth.guard';

@Controller('statistics')
export class StatisticsController {
  constructor(private _statisticsService: StatisticsService) {}

  @Get('top-users')
  async getTopUsers() {
    return await this._statisticsService.getTopUsers();
  }

  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit: number = 50) {
    return await this._statisticsService.getTopUsers();
  }

  @Get('leaderboard-advanced')
  async getAdvancedLeaderboard(
    @Query('period') period: string = 'all', // all, today, week, month, year
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('resourceType') resourceType: string = 'yachay', // yachay, tumis, mullu
    @Query('institutionId') institutionId?: number,
    @Query('limit') limit: number = 50
  ) {
    return await this._statisticsService.getAdvancedLeaderboard({
      period,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      resourceType,
      institutionId,
      limit
    });
  }

  @Get('institutions')
  async getInstitutions() {
    return await this._statisticsService.getInstitutions();
  }

  @Get('cursos-clases-evaluaciones')
  @UseGuards(AuthGuard)
  async getCursosClasesEvaluaciones(@Request() req) {
    const { id: userId } = req.user;
    return await this._statisticsService.getCursosClasesEvaluaciones(userId);
  }
}
