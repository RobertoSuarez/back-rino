import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminDashboardService } from '../services/admin-dashboard.service';
import { AuthGuard } from '../../user/guards/auth/auth.guard';
import { RolesGuard } from '../../user/guards/roles/roles.guard';
import { Roles } from '../../user/decorators/roles.decorator';

@ApiTags('admin-dashboard')
@UseGuards(AuthGuard)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private dashboardService: AdminDashboardService) {}

  @ApiOperation({ summary: 'Obtiene las estadísticas del dashboard del administrador' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('stats')
  async getDashboardStats() {
    return await this.dashboardService.getDashboardStats();
  }
}
