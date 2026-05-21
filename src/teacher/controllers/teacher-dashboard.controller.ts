import { Controller, Get, Param, ParseIntPipe, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TeacherDashboardService } from '../services/teacher-dashboard.service';
import { AuthGuard } from '../../user/guards/auth/auth.guard';
import { RolesGuard } from '../../user/guards/roles/roles.guard';
import { Roles } from '../../user/decorators/roles.decorator';

@ApiTags('teacher-dashboard')
@UseGuards(AuthGuard)
@Controller('teacher/dashboard')
export class TeacherDashboardController {
  constructor(private dashboardService: TeacherDashboardService) {}

  @ApiOperation({ summary: 'Obtiene las estadísticas del dashboard del profesor' })
  @UseGuards(RolesGuard)
  @Roles('teacher')
  @Get('stats')
  async getDashboardStats(@Request() req) {
    const { id: teacherId } = req.user;
    return await this.dashboardService.getDashboardStats(teacherId);
  }

  @ApiOperation({ summary: 'Obtiene la lista de estudiantes del profesor' })
  @UseGuards(RolesGuard)
  @Roles('teacher')
  @Get('students')
  async getStudentsList(@Request() req) {
    const { id: teacherId } = req.user;
    return await this.dashboardService.getStudentsList(teacherId);
  }

  @ApiOperation({ summary: 'Obtiene el rendimiento detallado de un estudiante (por actividad)' })
  @UseGuards(RolesGuard)
  @Roles('teacher')
  @Get('students/:studentId')
  async getStudentDetail(
    @Request() req,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    const { id: teacherId } = req.user;
    return await this.dashboardService.getStudentDetail(teacherId, studentId);
  }
}
