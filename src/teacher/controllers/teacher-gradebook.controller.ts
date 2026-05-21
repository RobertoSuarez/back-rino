import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { TeacherGradebookService } from '../services/teacher-gradebook.service';
import { AuthGuard } from '../../user/guards/auth/auth.guard';
import { RolesGuard } from '../../user/guards/roles/roles.guard';
import { Roles } from '../../user/decorators/roles.decorator';
import { BulkGradeDto, UpsertGradeDto } from '../dtos/grade-book.dto';

@ApiTags('teacher-gradebook')
@UseGuards(AuthGuard, RolesGuard)
@Roles('teacher')
@Controller('teacher/gradebook')
export class TeacherGradebookController {
  constructor(private gradebookService: TeacherGradebookService) {}

  @ApiOperation({ summary: 'Rutas del profesor con estadísticas de calificaciones' })
  @Get('paths')
  async getTeacherPaths(@Request() req) {
    const { id: teacherId } = req.user;
    const data = await this.gradebookService.getTeacherPaths(teacherId);
    return { statusCode: 200, message: 'OK', data };
  }

  @ApiOperation({ summary: 'Estudiantes de una ruta con sus calificaciones' })
  @Get('paths/:pathId/grades')
  async getPathGrades(
    @Request() req,
    @Param('pathId', ParseIntPipe) pathId: number,
  ) {
    const { id: teacherId } = req.user;
    const data = await this.gradebookService.getPathGrades(pathId, teacherId);
    return { statusCode: 200, message: 'OK', data };
  }

  @ApiOperation({ summary: 'Calcular notas sugeridas masivas para una ruta' })
  @Post('paths/:pathId/grades/calculate')
  async calculateSuggestedGrades(
    @Request() req,
    @Param('pathId', ParseIntPipe) pathId: number,
  ) {
    const { id: teacherId } = req.user;
    const data = await this.gradebookService.bulkCalculateSuggestedGrades(pathId, teacherId);
    return { statusCode: 200, message: 'Notas sugeridas calculadas', data };
  }

  @ApiOperation({ summary: 'Guardar múltiples notas finales (bulk)' })
  @Post('grades/bulk')
  async bulkSaveGrades(@Request() req, @Body() dto: BulkGradeDto) {
    const { id: teacherId } = req.user;
    const data = await this.gradebookService.bulkSaveGrades(dto, teacherId);
    return { statusCode: 200, message: 'Calificaciones guardadas', data };
  }

  @ApiOperation({ summary: 'Editar una calificación individual' })
  @Put('grades/:gradeId')
  async updateGrade(
    @Request() req,
    @Body() dto: UpsertGradeDto,
  ) {
    const { id: teacherId } = req.user;
    const data = await this.gradebookService.upsertGrade(dto, teacherId);
    return { statusCode: 200, message: 'Calificación actualizada', data };
  }

  @ApiOperation({ summary: 'Descargar reporte PDF de calificaciones' })
  @Get('paths/:pathId/report/pdf')
  async downloadPdf(
    @Request() req,
    @Param('pathId', ParseIntPipe) pathId: number,
    @Res() res: Response,
  ) {
    const { id: teacherId } = req.user;
    const buffer = await this.gradebookService.generatePdfReport(pathId, teacherId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="calificaciones-ruta-${pathId}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @ApiOperation({ summary: 'Descargar reporte Excel de calificaciones' })
  @Get('paths/:pathId/report/excel')
  async downloadExcel(
    @Request() req,
    @Param('pathId', ParseIntPipe) pathId: number,
    @Res() res: Response,
  ) {
    const { id: teacherId } = req.user;
    const buffer = await this.gradebookService.generateExcelReport(pathId, teacherId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="calificaciones-ruta-${pathId}.xlsx"`,
    });
    res.end(buffer);
  }
}
