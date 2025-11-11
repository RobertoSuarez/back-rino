import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmaautaFeedbackRating } from '../../../database/entities/amaautaFeedbackRating.entity';
import {
  CreateAmaautaFeedbackRatingDto,
  AmaautaFeedbackRatingDto,
  AmaautaFeedbackRatingStatsDto,
} from '../../dtos/amaautaFeedbackRating.dto';

@Injectable()
export class AmaautaFeedbackRatingService {
  constructor(
    @InjectRepository(AmaautaFeedbackRating)
    private readonly feedbackRatingRepository: Repository<AmaautaFeedbackRating>,
  ) {}

  /**
   * Crear una nueva calificación de retroalimentación de Amauta
   */
  async createRating(
    createDto: CreateAmaautaFeedbackRatingDto,
  ): Promise<AmaautaFeedbackRatingDto> {
    console.log('📥 DTO recibido en servicio:', createDto);
    
    // Validar que la calificación esté entre 1 y 5
    if (!createDto.rating || createDto.rating < 1 || createDto.rating > 5) {
      throw new Error('La calificación debe estar entre 1 y 5');
    }

    // Validar que userId esté presente
    if (!createDto.userId) {
      throw new Error('El userId es requerido');
    }

    const rating = this.feedbackRatingRepository.create(createDto);
    console.log('📝 Entidad creada:', rating);
    
    const saved = await this.feedbackRatingRepository.save(rating);
    console.log('💾 Entidad guardada:', saved);

    return this.mapToDto(saved);
  }

  /**
   * Obtener todas las calificaciones de un usuario
   */
  async getUserRatings(userId: number): Promise<AmaautaFeedbackRatingDto[]> {
    const ratings = await this.feedbackRatingRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return ratings.map((r) => this.mapToDto(r));
  }

  /**
   * Obtener estadísticas de calificaciones de un usuario
   */
  async getUserRatingStats(userId: number): Promise<AmaautaFeedbackRatingStatsDto> {
    const ratings = await this.feedbackRatingRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100, // Últimas 100 calificaciones
    });

    if (ratings.length === 0) {
      return {
        totalRatings: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recentRatings: [],
      };
    }

    // Calcular distribución de calificaciones
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    ratings.forEach((r) => {
      distribution[r.rating]++;
      sum += r.rating;
    });

    const averageRating = sum / ratings.length;

    return {
      totalRatings: ratings.length,
      averageRating: Math.round(averageRating * 100) / 100,
      ratingDistribution: distribution,
      recentRatings: ratings.slice(0, 10).map((r) => this.mapToDto(r)),
    };
  }

  /**
   * Obtener calificaciones globales (para estadísticas del sistema)
   */
  async getGlobalStats(): Promise<AmaautaFeedbackRatingStatsDto> {
    const ratings = await this.feedbackRatingRepository.find({
      order: { createdAt: 'DESC' },
      take: 1000, // Últimas 1000 calificaciones globales
    });

    if (ratings.length === 0) {
      return {
        totalRatings: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recentRatings: [],
      };
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    ratings.forEach((r) => {
      distribution[r.rating]++;
      sum += r.rating;
    });

    const averageRating = sum / ratings.length;

    return {
      totalRatings: ratings.length,
      averageRating: Math.round(averageRating * 100) / 100,
      ratingDistribution: distribution,
      recentRatings: ratings.slice(0, 10).map((r) => this.mapToDto(r)),
    };
  }

  /**
   * Obtener calificaciones por tipo de ejercicio
   */
  async getRatingsByExerciseType(
    exerciseType: string,
  ): Promise<AmaautaFeedbackRatingStatsDto> {
    const ratings = await this.feedbackRatingRepository.find({
      where: { exerciseType },
      order: { createdAt: 'DESC' },
      take: 500,
    });

    if (ratings.length === 0) {
      return {
        totalRatings: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recentRatings: [],
      };
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    ratings.forEach((r) => {
      distribution[r.rating]++;
      sum += r.rating;
    });

    const averageRating = sum / ratings.length;

    return {
      totalRatings: ratings.length,
      averageRating: Math.round(averageRating * 100) / 100,
      ratingDistribution: distribution,
      recentRatings: ratings.slice(0, 10).map((r) => this.mapToDto(r)),
    };
  }

  /**
   * Mapear entidad a DTO
   */
  private mapToDto(entity: AmaautaFeedbackRating): AmaautaFeedbackRatingDto {
    return {
      id: entity.id,
      userId: entity.userId,
      rating: entity.rating,
      feedback: entity.feedback,
      userAnswer: entity.userAnswer,
      comment: entity.comment,
      exerciseType: entity.exerciseType,
      exerciseId: entity.exerciseId,
      activityName: entity.activityName,
      exerciseQualification: entity.exerciseQualification
        ? Number(entity.exerciseQualification)
        : undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
