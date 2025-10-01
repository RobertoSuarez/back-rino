import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LearningPathService } from '../services/learning-path.service';
import {
  CreateLearningPathDto,
  UpdateLearningPathDto,
  LearningPathDto,
} from '../dtos/learning-path.dtos';
import { SubscribeToPathDto } from '../dtos/subscription.dtos';
import { AuthGuard } from '../../user/guards/auth/auth.guard';
import { RolesGuard } from '../../user/guards/roles/roles.guard';
import { Roles } from '../../user/decorators/roles.decorator';

@ApiTags('learning-paths')
@UseGuards(AuthGuard)
@Controller('learning-paths')
export class LearningPathController {
  constructor(private learningPathService: LearningPathService) {}

  @ApiOperation({ summary: 'Obtiene todas las rutas de aprendizaje' })
  @Get()
  async findAll(@Request() req) {
    const { id: userId, typeUser } = req.user;
    return await this.learningPathService.findAll(userId, typeUser);
  }

  @ApiOperation({ summary: 'Genera códigos para rutas existentes (migración temporal)' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('migrate/generate-codes')
  async generateCodes() {
    await this.learningPathService.generateCodesForExistingPaths();
    return { message: 'Códigos generados exitosamente para todas las rutas' };
  }

  // ==================== ENDPOINTS PARA ESTUDIANTES ====================

  @ApiOperation({ summary: 'Suscribe al estudiante a una ruta usando el código' })
  @UseGuards(RolesGuard)
  @Roles('student')
  @Post('subscribe')
  async subscribe(@Body() payload: SubscribeToPathDto, @Request() req) {
    const { id: userId } = req.user;
    return await this.learningPathService.subscribeToPath(userId, payload);
  }

  @ApiOperation({ summary: 'Obtiene el detalle completo de una ruta suscrita' })
  @UseGuards(RolesGuard)
  @Roles('student')
  @Get('subscriptions/:id/detail')
  async getPathDetail(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const { id: userId } = req.user;
    return await this.learningPathService.getPathDetailForStudent(id, userId);
  }

  @ApiOperation({ summary: 'Obtiene las rutas suscritas del estudiante' })
  @UseGuards(RolesGuard)
  @Roles('student')
  @Get('subscriptions')
  async getMySubscriptions(@Request() req) {
    const { id: userId } = req.user;
    return await this.learningPathService.getMySubscriptions(userId);
  }

  @ApiOperation({ summary: 'Cancela la suscripción a una ruta' })
  @UseGuards(RolesGuard)
  @Roles('student')
  @Delete('subscriptions/:id')
  async unsubscribe(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const { id: userId } = req.user;
    await this.learningPathService.unsubscribeFromPath(id, userId);
    return { message: 'Suscripción cancelada exitosamente' };
  }

  // ==================== ENDPOINTS CRUD ====================

  @ApiOperation({ summary: 'Obtiene una ruta de aprendizaje por ID' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.learningPathService.findOne(id);
  }

  @ApiOperation({ summary: 'Crea una nueva ruta de aprendizaje' })
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  @Post()
  async create(@Body() payload: CreateLearningPathDto, @Request() req) {
    const { id: userId } = req.user;
    return await this.learningPathService.create(payload, userId);
  }

  @ApiOperation({ summary: 'Actualiza una ruta de aprendizaje' })
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateLearningPathDto,
    @Request() req,
  ) {
    const { id: userId, typeUser } = req.user;
    return await this.learningPathService.update(id, payload, userId, typeUser);
  }

  @ApiOperation({ summary: 'Elimina una ruta de aprendizaje' })
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const { id: userId, typeUser } = req.user;
    await this.learningPathService.delete(id, userId, typeUser);
    return { message: 'Ruta de aprendizaje eliminada exitosamente' };
  }
}
