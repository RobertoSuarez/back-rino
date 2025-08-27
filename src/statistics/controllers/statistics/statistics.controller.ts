import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { StatisticsService } from '../../../statistics/service/statistics/statistics.service';
import { AuthGuard } from 'src/user/guards/auth/auth.guard';

@Controller('statistics')
export class StatisticsController {
  constructor(private _statisticsService: StatisticsService) {}

  @Get('top-users')
  async getTopUsers() {
    return await this._statisticsService.getTopUsers();
  }

  @Get('cursos-clases-evaluaciones')
  @UseGuards(AuthGuard)
  async getCursosClasesEvaluaciones(@Request() req) {
    const { id: userId } = req.user;
    return await this._statisticsService.getCursosClasesEvaluaciones(userId);
  }
}
