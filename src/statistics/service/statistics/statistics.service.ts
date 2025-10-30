import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityProgressUser } from '../../../database/entities/activityProgress.entity';
import { User } from '../../../database/entities/user.entity';
import { GameTransaction, ResourceType } from '../../../database/entities/gameTransaction.entity';
import { Institution } from '../../../database/entities/institution.entity';
import { Course } from 'src/database/entities/course.entity';

interface AdvancedLeaderboardOptions {
  period: string;
  startDate?: Date;
  endDate?: Date;
  resourceType: string;
  institutionId?: number;
  limit: number;
}

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(User)
    private _userRepository: Repository<User>,
    @InjectRepository(ActivityProgressUser)
    private _activityProgressUserRepository: Repository<ActivityProgressUser>,
    @InjectRepository(Course)
    private _courseRepository: Repository<Course>,
    @InjectRepository(GameTransaction)
    private _gameTransactionRepository: Repository<GameTransaction>,
    @InjectRepository(Institution)
    private _institutionRepository: Repository<Institution>
  ) {}

  async getTopUsers() {
    // Obtener los usuarios con sus puntuaciones de actividades
    const result = await this._activityProgressUserRepository
      .createQueryBuilder('activityProgressUser')
      .select(
        'user.id as id, user.firstName as firstName, user.lastName as lastName, ' +
        'user.urlAvatar as urlAvatar, user.yachay as yachay, ' +
        'ROUND(SUM(score)::numeric, 2)::int AS ihi',
      )
      .leftJoin('activityProgressUser.user', 'user')
      .groupBy('user.id')
      .orderBy('user.yachay', 'DESC') // Ordenar por yachay en lugar de ihi
      .limit(50)
      .getRawMany();
    
    // Para cada usuario, contar sus suscripciones
    const usersWithSubscriptions = await Promise.all(
      result.map(async (r) => {
        // Contar suscripciones para este usuario
        const subscriptionsCount = await this._userRepository
          .createQueryBuilder('user')
          .leftJoinAndSelect('user.subscriptions', 'subscription')
          .where('user.id = :userId', { userId: r.id })
          .getOne()
          .then(user => user?.subscriptions?.length || 0);
        
        return {
          id: r.id,
          firstName: r.firstname,
          lastName: r.lastname,
          url: r.urlavatar
            ? r.urlavatar
            : `https://ui-avatars.com/api/?name=${r.firstname?.split(' ')[0]}+${r.lastname?.split(' ')[0]}&background=1B802F&color=fff`,
          ihi: r.ihi || 0,
          yachay: r.yachay || 0,
          subscriptionsCount: subscriptionsCount,
          rank: 0 // Se llenará después
        };
      })
    );
    
    // Asignar ranking
    return usersWithSubscriptions
      .sort((a, b) => b.yachay - a.yachay) // Ordenar por yachay en lugar de ihi
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));
  }

  async getCursosClasesEvaluaciones(userId: number) {
    const countCourses = await this._courseRepository.count({
      where: {
        createdBy: {
          id: userId,
        },
      },
    });

    // Ya no usamos Classes ni Assessment
    return {
      countCourses,
      countClass: 0,
      assessmentPending: 0,
    };
  }

  async getScoreByUser(userId: number): Promise<number> {
    const result = await this._activityProgressUserRepository
      .createQueryBuilder('activityProgressUser')
      .select('ROUND(SUM(score)::numeric, 2)::float AS score')
      .where('activityProgressUser.userId = :userId', { userId })
      .groupBy('activityProgressUser.userId')
      .getRawOne();
    return result ? parseInt(result['score']) : 0;
  }

  private getDateRange(period: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    const endDate = new Date(now);
    let startDate = new Date(now);

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0); // Desde el inicio
    }

    return { startDate, endDate };
  }

  async getAdvancedLeaderboard(options: AdvancedLeaderboardOptions) {
    const { period, startDate, endDate, resourceType, institutionId, limit } = options;
    
    // Determinar rango de fechas
    const dateRange = startDate && endDate 
      ? { startDate, endDate }
      : this.getDateRange(period);

    // Construir consulta base para transacciones
    let query = this._gameTransactionRepository
      .createQueryBuilder('gt')
      .select([
        'user.id as id',
        'user.firstName as firstName', 
        'user.lastName as lastName',
        'user.urlAvatar as urlAvatar',
        'user.yachay as currentYachay',
        'user.tumis as currentTumis', 
        'user.mullu as currentMullu',
        'institution.name as institutionName',
        'COALESCE(SUM(CASE WHEN gt.resourceType = :resourceType THEN gt.amount ELSE 0 END), 0) as periodScore'
      ])
      .leftJoin('gt.user', 'user')
      .leftJoin('user.institution', 'institution')
      .where('gt.createdAt BETWEEN :startDate AND :endDate', {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      })
      .andWhere('gt.transactionType IN (:...transactionTypes)', {
        transactionTypes: ['earn', 'bonus', 'reward']
      })
      .groupBy('user.id, institution.name')
      .orderBy('periodScore', 'DESC')
      .limit(limit);

    // Agregar filtros
    if (institutionId) {
      query = query.andWhere('user.institutionId = :institutionId', { institutionId });
    }

    // Parametrizar tipo de recurso
    query.setParameters({ resourceType });

    const results = await query.getRawMany();

    // Formatear resultados
    const formattedResults = results.map((result, index) => ({
      id: result.id,
      firstName: result.firstname,
      lastName: result.lastname,
      url: result.urlavatar 
        ? result.urlavatar
        : `https://ui-avatars.com/api/?name=${result.firstname?.split(' ')[0]}+${result.lastname?.split(' ')[0]}&background=1B802F&color=fff`,
      institutionName: result.institutionname || 'Independiente',
      periodScore: parseInt(result.periodscore) || 0,
      currentYachay: result.currentyachay || 0,
      currentTumis: result.currenttumis || 0,
      currentMullu: result.currentmullu || 0,
      rank: index + 1,
      resourceType,
      period,
      dateRange
    }));

    return {
      users: formattedResults,
      meta: {
        period,
        resourceType,
        institutionId,
        dateRange,
        totalUsers: formattedResults.length,
        generatedAt: new Date()
      }
    };
  }

  async getInstitutions() {
    return await this._institutionRepository.find({
      where: { status: 'active' },
      order: { name: 'ASC' },
      select: ['id', 'name', 'description', 'logoUrl']
    });
  }
}
