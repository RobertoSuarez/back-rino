import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { User } from '../../../database/entities/user.entity';
import { Course } from '../../../database/entities/course.entity';
import { Chapter } from '../../../database/entities/chapter.entity';
import { Tema } from '../../../database/entities/tema.entity';
import { Activity } from '../../../database/entities/activity.entity';
import { ActivityProgressUser } from '../../../database/entities/activityProgress.entity';
import { ChapterProgressUser } from '../../../database/entities/chapterProgressUser.entity';
import { TemaProgressUser } from '../../../database/entities/temaProgressUser.entity';
import * as moment from 'moment';

@Injectable()
export class AdminStatisticsService {
  constructor(
    @InjectRepository(User)
    private _userRepository: Repository<User>,
    @InjectRepository(Course)
    private _courseRepository: Repository<Course>,
    @InjectRepository(Chapter)
    private _chapterRepository: Repository<Chapter>,
    @InjectRepository(Tema)
    private _temaRepository: Repository<Tema>,
    @InjectRepository(Activity)
    private _activityRepository: Repository<Activity>,
    @InjectRepository(ActivityProgressUser)
    private _activityProgressUserRepository: Repository<ActivityProgressUser>,
    @InjectRepository(ChapterProgressUser)
    private _chapterProgressUserRepository: Repository<ChapterProgressUser>,
    @InjectRepository(TemaProgressUser)
    private _temaProgressUserRepository: Repository<TemaProgressUser>,
  ) {}

  /**
   * Obtiene las estadísticas generales para el dashboard
   */
  async getDashboardStats() {
    const totalUsers = await this._userRepository.count();
    const totalCourses = await this._courseRepository.count();
    const totalChapters = await this._chapterRepository.count();
    const totalTemas = await this._temaRepository.count();
    const totalActivities = await this._activityRepository.count();

    // Usuarios registrados en el último mes
    const lastMonthDate = moment().subtract(30, 'days').toDate();
    const newUsersLastMonth = await this._userRepository.count({
      where: {
        createdAt: MoreThan(lastMonthDate),
      },
    });

    // Usuarios activos (con actividad en el último mes)
    const activeUsers = await this._activityProgressUserRepository
      .createQueryBuilder('progress')
      .select('COUNT(DISTINCT progress.userId)', 'count')
      .where('progress.createdAt > :date', { date: lastMonthDate })
      .getRawOne();

    // Promedio de calificaciones global
    const avgScores = await this._activityProgressUserRepository
      .createQueryBuilder('progress')
      .select('AVG(progress.score)', 'average')
      .getRawOne();

    return {
      totalUsers,
      totalCourses,
      totalChapters,
      totalTemas,
      totalActivities,
      newUsersLastMonth,
      activeUsers: parseInt(activeUsers?.count || '0'),
      avgScore: parseFloat(avgScores?.average || '0').toFixed(2),
    };
  }

  /**
   * Obtiene estadísticas detalladas de usuarios
   */
  async getUsersStats() {
    const totalUsers = await this._userRepository.count();
    
    // Contar estudiantes y profesores
    const totalStudents = await this._userRepository.count({
      where: { typeUser: 'student' },
    });

    const totalTeachers = await this._userRepository.count({
      where: { typeUser: 'teacher' },
    });

    const totalAdmins = await this._userRepository.count({
      where: { typeUser: 'admin' },
    });
    
    // Usuarios por tipo
    const usersByType = await this._userRepository
      .createQueryBuilder('user')
      .select('user.typeUser', 'type')
      .addSelect('COUNT(user.id)', 'count')
      .groupBy('user.typeUser')
      .getRawMany();

    // Usuarios por estado
    const usersByStatus = await this._userRepository
      .createQueryBuilder('user')
      .select('user.status', 'status')
      .addSelect('COUNT(user.id)', 'count')
      .groupBy('user.status')
      .getRawMany();

    // Usuarios verificados vs no verificados
    const verifiedUsers = await this._userRepository.count({
      where: { isVerified: true },
    });

    return {
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAdmins,
      usersByType,
      usersByStatus,
      verifiedUsers,
      nonVerifiedUsers: totalUsers - verifiedUsers,
    };
  }

  /**
   * Obtiene el crecimiento de usuarios en un período específico
   */
  async getUsersGrowth(period: string = 'monthly') {
    let format: string;
    let dateFormat: string;
    let subtractUnit: moment.unitOfTime.DurationConstructor;
    let limit: number;

    switch (period) {
      case 'daily':
        format = 'YYYY-MM-DD';
        dateFormat = 'DD/MM';
        subtractUnit = 'days';
        limit = 30;
        break;
      case 'weekly':
        format = 'YYYY-WW';
        dateFormat = 'WW/YYYY';
        subtractUnit = 'weeks';
        limit = 12;
        break;
      case 'monthly':
      default:
        format = 'YYYY-MM';
        dateFormat = 'MM/YYYY';
        subtractUnit = 'months';
        limit = 12;
        break;
    }

    const startDate = moment().subtract(limit, subtractUnit).startOf(subtractUnit as any).toDate();

    const result = await this._userRepository
      .createQueryBuilder('user')
      .select(`TO_CHAR(user.createdAt, '${format}')`, 'period')
      .addSelect('COUNT(user.id)', 'count')
      .where('user.createdAt >= :startDate', { startDate })
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();

    // Formatear las fechas para la visualización
    return result.map(item => ({
      period: moment(item.period, format).format(dateFormat),
      count: parseInt(item.count),
    }));
  }

  /**
   * Obtiene los usuarios activos en un período específico
   */
  async getActiveUsers(period: string = 'monthly') {
    let format: string;
    let dateFormat: string;
    let subtractUnit: moment.unitOfTime.DurationConstructor;
    let limit: number;

    switch (period) {
      case 'daily':
        format = 'YYYY-MM-DD';
        dateFormat = 'DD/MM';
        subtractUnit = 'days';
        limit = 30;
        break;
      case 'weekly':
        format = 'YYYY-WW';
        dateFormat = 'WW/YYYY';
        subtractUnit = 'weeks';
        limit = 12;
        break;
      case 'monthly':
      default:
        format = 'YYYY-MM';
        dateFormat = 'MM/YYYY';
        subtractUnit = 'months';
        limit = 12;
        break;
    }

    const startDate = moment().subtract(limit, subtractUnit).startOf(subtractUnit as any).toDate();

    const result = await this._activityProgressUserRepository
      .createQueryBuilder('progress')
      .select(`TO_CHAR(progress.createdAt, '${format}')`, 'period')
      .addSelect('COUNT(DISTINCT progress.userId)', 'count')
      .where('progress.createdAt >= :startDate', { startDate })
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();

    // Formatear las fechas para la visualización
    return result.map(item => ({
      period: moment(item.period, format).format(dateFormat),
      count: parseInt(item.count),
    }));
  }

  /**
   * Obtiene datos demográficos de los usuarios
   */
  async getUsersDemographics() {
    // Usuarios por edad (si hay datos de cumpleaños)
    const usersByAge = await this._userRepository
      .createQueryBuilder('user')
      .select('EXTRACT(YEAR FROM AGE(CURRENT_DATE, user.birthday))', 'age')
      .addSelect('COUNT(user.id)', 'count')
      .where('user.birthday IS NOT NULL')
      .groupBy('age')
      .orderBy('age', 'ASC')
      .getRawMany();

    // Agrupar por rangos de edad
    const ageRanges = {
      '0-18': 0,
      '19-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-60': 0,
      '60+': 0,
    };

    usersByAge.forEach(item => {
      const age = parseInt(item.age);
      const count = parseInt(item.count);

      if (age <= 18) ageRanges['0-18'] += count;
      else if (age <= 25) ageRanges['19-25'] += count;
      else if (age <= 35) ageRanges['26-35'] += count;
      else if (age <= 45) ageRanges['36-45'] += count;
      else if (age <= 60) ageRanges['46-60'] += count;
      else ageRanges['60+'] += count;
    });

    return {
      ageRanges: Object.entries(ageRanges).map(([range, count]) => ({ range, count })),
    };
  }

  /**
   * Obtiene estadísticas generales de cursos
   */
  async getCoursesStats() {
    const totalCourses = await this._courseRepository.count();
    const totalChapters = await this._chapterRepository.count();
    const totalTemas = await this._temaRepository.count();
    const totalActivities = await this._activityRepository.count();

    // Cursos públicos vs privados
    const publicCourses = await this._courseRepository.count({
      where: { isPublic: true },
    });

    // Promedio de capítulos por curso
    const avgChaptersPerCourse = totalCourses > 0 ? totalChapters / totalCourses : 0;

    // Promedio de temas por capítulo
    const avgTemasPerChapter = totalChapters > 0 ? totalTemas / totalChapters : 0;

    // Promedio de actividades por tema
    const avgActivitiesPerTema = totalTemas > 0 ? totalActivities / totalTemas : 0;

    return {
      totalCourses,
      totalChapters,
      totalTemas,
      totalActivities,
      publicCourses,
      privateCourses: totalCourses - publicCourses,
      avgChaptersPerCourse: avgChaptersPerCourse.toFixed(2),
      avgTemasPerChapter: avgTemasPerChapter.toFixed(2),
      avgActivitiesPerTema: avgActivitiesPerTema.toFixed(2),
    };
  }

  /**
   * Obtiene los cursos más populares
   */
  async getPopularCourses() {
    return await this._courseRepository
      .createQueryBuilder('course')
      .leftJoin('course.subscriptions', 'subscription')
      .select('course.id', 'id')
      .addSelect('course.title', 'title')
      .addSelect('course.description', 'description')
      .addSelect('COUNT(subscription.id)', 'userCount')
      .groupBy('course.id')
      .addGroupBy('course.title')
      .addGroupBy('course.description')
      .orderBy('COUNT(subscription.id)', 'DESC')
      .limit(10)
      .getRawMany();
  }

  /**
   * Obtiene estadísticas de finalización de cursos
   */
  async getCoursesCompletion() {
    // Para cada curso, calcular el progreso promedio de los usuarios
    const courses = await this._courseRepository.find();
    const result = [];

    for (const course of courses) {
      // Obtener todos los capítulos del curso
      const chapters = await this._chapterRepository.find({
        where: { course: { id: course.id } },
      });

      if (chapters.length === 0) {
        result.push({
          courseId: course.id,
          courseTitle: course.title,
          avgCompletion: 0,
          usersCount: 0,
        });
        continue;
      }

      // Obtener el progreso de los capítulos para este curso
      const chapterIds = chapters.map(chapter => chapter.id);
      const chapterProgress = await this._chapterProgressUserRepository
        .createQueryBuilder('progress')
        .leftJoin('progress.chapter', 'chapter')
        .select('progress.userId', 'userId')
        .addSelect('AVG(progress.progress)', 'avgProgress')
        .where('chapter.id IN (:...chapterIds)', { chapterIds })
        .groupBy('progress.userId')
        .getRawMany();

      // Calcular el promedio de finalización
      const totalProgress = chapterProgress.reduce((sum, item) => sum + parseFloat(item.avgProgress || 0), 0);
      const avgCompletion = chapterProgress.length > 0 ? totalProgress / chapterProgress.length : 0;

      result.push({
        courseId: course.id,
        courseTitle: course.title,
        avgCompletion: avgCompletion.toFixed(2),
        usersCount: chapterProgress.length,
      });
    }

    return result;
  }

  /**
   * Obtiene las puntuaciones promedio
   */
  async getAverageScores() {
    // Puntuación promedio por actividad
    const activityScores = await this._activityProgressUserRepository
      .createQueryBuilder('progress')
      .leftJoin('progress.activity', 'activity')
      .select('activity.id', 'activityId')
      .addSelect('activity.title', 'activityTitle')
      .addSelect('AVG(progress.score)', 'avgScore')
      .addSelect('COUNT(progress.id)', 'attempts')
      .groupBy('activity.id')
      .orderBy('avgScore', 'DESC')
      .getRawMany();

    // Puntuación promedio por tema
    const temaScores = await this._activityProgressUserRepository
      .createQueryBuilder('progress')
      .leftJoin('progress.activity', 'activity')
      .leftJoin('activity.tema', 'tema')
      .select('tema.id', 'temaId')
      .addSelect('tema.title', 'temaTitle')
      .addSelect('AVG(progress.score)', 'avgScore')
      .addSelect('COUNT(progress.id)', 'attempts')
      .groupBy('tema.id')
      .orderBy('avgScore', 'DESC')
      .getRawMany();

    return {
      activityScores: activityScores.map(item => ({
        ...item,
        avgScore: parseFloat(item.avgScore || 0).toFixed(2),
        attempts: parseInt(item.attempts),
      })),
      temaScores: temaScores.map(item => ({
        ...item,
        avgScore: parseFloat(item.avgScore || 0).toFixed(2),
        attempts: parseInt(item.attempts),
      })),
    };
  }

  /**
   * Obtiene el progreso de los estudiantes
   */
  async getStudentProgress() {
    // Progreso promedio por usuario
    const userProgress = await this._activityProgressUserRepository
      .createQueryBuilder('progress')
      .leftJoin('progress.user', 'user')
      .select('user.id', 'userId')
      .addSelect('user.firstName', 'firstName')
      .addSelect('user.lastName', 'lastName')
      .addSelect('AVG(progress.progress)', 'avgProgress')
      .addSelect('AVG(progress.score)', 'avgScore')
      .groupBy('user.id')
      .orderBy('avgProgress', 'DESC')
      .limit(20)
      .getRawMany();

    return userProgress.map(item => ({
      userId: item.userId,
      firstName: item.firstName,
      lastName: item.lastName,
      avgProgress: parseFloat(item.avgProgress || 0).toFixed(2),
      avgScore: parseFloat(item.avgScore || 0).toFixed(2),
    }));
  }

  /**
   * Obtiene estadísticas de éxito en actividades
   */
  async getActivitiesSuccess() {
    // Actividades con mayor tasa de éxito (score > 70)
    const successfulActivities = await this._activityProgressUserRepository
      .createQueryBuilder('progress')
      .leftJoin('progress.activity', 'activity')
      .select('activity.id', 'activityId')
      .addSelect('activity.title', 'activityTitle')
      .addSelect('COUNT(progress.id)', 'totalAttempts')
      .addSelect('SUM(CASE WHEN progress.score >= 70 THEN 1 ELSE 0 END)', 'successful_attempts')
      .groupBy('activity.id')
      .having('COUNT(progress.id) > 5') // Solo actividades con más de 5 intentos
      .orderBy('successful_attempts', 'DESC')
      .limit(10)
      .getRawMany();

    // Actividades con menor tasa de éxito
    const challengingActivities = await this._activityProgressUserRepository
      .createQueryBuilder('progress')
      .leftJoin('progress.activity', 'activity')
      .select('activity.id', 'activityId')
      .addSelect('activity.title', 'activityTitle')
      .addSelect('COUNT(progress.id)', 'totalAttempts')
      .addSelect('SUM(CASE WHEN progress.score >= 70 THEN 1 ELSE 0 END)', 'successful_attempts')
      .groupBy('activity.id')
      .having('COUNT(progress.id) > 5') // Solo actividades con más de 5 intentos
      .orderBy('successful_attempts', 'ASC')
      .limit(10)
      .getRawMany();

    // Calcular tasas de éxito
    const processActivities = (activities) => {
      return activities.map(item => ({
        activityId: item.activityId,
        activityTitle: item.activityTitle,
        totalAttempts: parseInt(item.totalAttempts),
        successfulAttempts: parseInt(item.successful_attempts || '0'),
        successRate: (parseInt(item.successful_attempts || '0') / parseInt(item.totalAttempts) * 100).toFixed(2),
      }));
    };

    return {
      mostSuccessful: processActivities(successfulActivities),
      mostChallenging: processActivities(challengingActivities),
    };
  }

  /**
   * Obtiene estadísticas de frecuencia de acceso
   */
  async getAccessFrequency() {
    // Utilizamos la tabla de progreso de actividades como indicador de actividad
    const lastMonthDate = moment().subtract(30, 'days').toDate();

    // Actividad por día de la semana
    const activityByDayOfWeek = await this._activityProgressUserRepository
      .createQueryBuilder('progress')
      .select('EXTRACT(DOW FROM progress.createdAt)', 'day_of_week')
      .addSelect('COUNT(progress.id)', 'count')
      .where('progress.createdAt >= :startDate', { startDate: lastMonthDate })
      .groupBy('day_of_week')
      .orderBy('day_of_week', 'ASC')
      .getRawMany();

    // Actividad por hora del día
    const activityByHour = await this._activityProgressUserRepository
      .createQueryBuilder('progress')
      .select('EXTRACT(HOUR FROM progress.createdAt)', 'hour')
      .addSelect('COUNT(progress.id)', 'count')
      .where('progress.createdAt >= :startDate', { startDate: lastMonthDate })
      .groupBy('hour')
      .orderBy('hour', 'ASC')
      .getRawMany();

    // Mapear días de la semana a nombres
    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    return {
      byDayOfWeek: activityByDayOfWeek.map(item => ({
        day: daysOfWeek[parseInt(item.day_of_week || '0')],
        count: parseInt(item.count || '0'),
      })),
      byHour: activityByHour.map(item => ({
        hour: parseInt(item.hour),
        count: parseInt(item.count),
      })),
    };
  }

  /**
   * Obtiene estadísticas de temas completados en un período específico
   */
  async getTemasCompletion(period: string = 'monthly') {
    let format: string;
    let dateFormat: string;
    let subtractUnit: moment.unitOfTime.DurationConstructor;
    let limit: number;

    switch (period) {
      case 'daily':
        format = 'YYYY-MM-DD';
        dateFormat = 'DD/MM';
        subtractUnit = 'days';
        limit = 30;
        break;
      case 'weekly':
        format = 'YYYY-WW';
        dateFormat = 'WW/YYYY';
        subtractUnit = 'weeks';
        limit = 12;
        break;
      case 'monthly':
      default:
        format = 'YYYY-MM';
        dateFormat = 'MM/YYYY';
        subtractUnit = 'months';
        limit = 12;
        break;
    }

    const startDate = moment().subtract(limit, subtractUnit).startOf(subtractUnit as any).toDate();

    const result = await this._temaProgressUserRepository
      .createQueryBuilder('progress')
      .select(`TO_CHAR(progress.createdAt, '${format}')`, 'period')
      .addSelect('COUNT(DISTINCT progress.userId)', 'count')
      .where('progress.createdAt >= :startDate', { startDate })
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();

    // Formatear las fechas para la visualización
    return result.map(item => ({
      period: moment(item.period, format).format(dateFormat),
      count: parseInt(item.count),
    }));
  }

  /**
   * Obtiene estadísticas de uso de recursos
   */
  async getResourceUsage() {
    // Actividades más realizadas
    const mostUsedActivities = await this._activityProgressUserRepository
      .createQueryBuilder('progress')
      .leftJoin('progress.activity', 'activity')
      .select('activity.id', 'activityId')
      .addSelect('activity.title', 'activityTitle')
      .addSelect('COUNT(progress.id)', 'usageCount')
      .groupBy('activity.id')
      .orderBy('usageCount', 'DESC')
      .limit(10)
      .getRawMany();

    // Temas más visitados
    const mostVisitedTemas = await this._temaProgressUserRepository
      .createQueryBuilder('progress')
      .leftJoin('progress.tema', 'tema')
      .select('tema.id', 'temaId')
      .addSelect('tema.title', 'temaTitle')
      .addSelect('COUNT(progress.id)', 'visitCount')
      .groupBy('tema.id')
      .orderBy('visitCount', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      mostUsedActivities: mostUsedActivities.map(item => ({
        activityId: item.activityId,
        activityTitle: item.activityTitle,
        usageCount: parseInt(item.usageCount),
      })),
      mostVisitedTemas: mostVisitedTemas.map(item => ({
        temaId: item.temaId,
        temaTitle: item.temaTitle,
        visitCount: parseInt(item.visitCount),
      })),
    };
  }
}
