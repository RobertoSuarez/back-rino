import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '../../../user/guards/auth/auth.guard';
import { AmaautaFeedbackRatingService } from '../../services/amaautaFeedbackRating/amaautaFeedbackRating.service';
import { CreateAmaautaFeedbackRatingDto } from '../../dtos/amaautaFeedbackRating.dto';

@Controller('amauta-feedback-rating')
export class AmaautaFeedbackRatingController {
  constructor(
    private readonly feedbackRatingService: AmaautaFeedbackRatingService,
  ) {}

  /**
   * Crear una nueva calificación de retroalimentación de Amauta
   * POST /amauta-feedback-rating
   */
  @Post()
  @UseGuards(AuthGuard)
  async createRating(
    @Body() createDto: CreateAmaautaFeedbackRatingDto,
    @Request() req,
  ) {
    console.log('🔵 Controlador recibió:', createDto);
    console.log('🔵 Usuario autenticado:', req.user?.id);
    
    // Asegurar que el userId sea del usuario autenticado
    createDto.userId = req.user.id;
    
    console.log('🔵 DTO después de agregar userId:', createDto);
    
    return this.feedbackRatingService.createRating(createDto);
  }

  /**
   * Obtener todas las calificaciones del usuario autenticado
   * GET /amauta-feedback-rating/my-ratings
   */
  @Get('my-ratings')
  @UseGuards(AuthGuard)
  async getMyRatings(@Request() req) {
    return this.feedbackRatingService.getUserRatings(req.user.id);
  }

  /**
   * Obtener estadísticas de calificaciones del usuario autenticado
   * GET /amauta-feedback-rating/my-stats
   */
  @Get('my-stats')
  @UseGuards(AuthGuard)
  async getMyStats(@Request() req) {
    return this.feedbackRatingService.getUserRatingStats(req.user.id);
  }

  /**
   * Obtener estadísticas globales de calificaciones
   * GET /amauta-feedback-rating/global-stats
   */
  @Get('global-stats')
  async getGlobalStats() {
    return this.feedbackRatingService.getGlobalStats();
  }

  /**
   * Obtener calificaciones por tipo de ejercicio
   * GET /amauta-feedback-rating/by-exercise-type/:exerciseType
   */
  @Get('by-exercise-type/:exerciseType')
  async getRatingsByExerciseType(@Param('exerciseType') exerciseType: string) {
    return this.feedbackRatingService.getRatingsByExerciseType(exerciseType);
  }
}
