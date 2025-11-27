import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In, Not } from 'typeorm';
import { LearningPath } from '../../database/entities/learningPath.entity';
import { LearningPathSubscription } from '../../database/entities/learningPathSubscription.entity';
import { Course } from '../../database/entities/course.entity';
import { ActivityProgressUser } from '../../database/entities/activityProgress.entity';
import { DateTime } from 'luxon';
import { formatDateFrontend } from '../../common/constants';

@Injectable()
export class TeacherDashboardService {
  constructor(
    @InjectRepository(LearningPath)
    private learningPathRepo: Repository<LearningPath>,
    @InjectRepository(LearningPathSubscription)
    private subscriptionRepo: Repository<LearningPathSubscription>,
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
    @InjectRepository(ActivityProgressUser)
    private activityProgressRepo: Repository<ActivityProgressUser>,
  ) {}

  async getDashboardStats(teacherId: number): Promise<any> {
    // ... (código existente de rutas y cursos) ...
    const teacherPaths = await this.learningPathRepo.find({
      where: { createdBy: { id: teacherId }, deletedAt: IsNull() },
      relations: ['subscriptions', 'subscriptions.student', 'courses'],
    });

    const pathIds = teacherPaths.map(p => p.id);
    const totalLearningPaths = teacherPaths.length;

    const totalCourses = await this.courseRepo.count({
      where: { createdBy: { id: teacherId }, deletedAt: IsNull() },
    });

    const activeSubscriptions = await this.subscriptionRepo
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.student', 'student')
      .leftJoinAndSelect('subscription.learningPath', 'learningPath')
      .where('learningPath.createdBy.id = :teacherId', { teacherId })
      .andWhere('subscription.deletedAt IS NULL')
      .andWhere('learningPath.deletedAt IS NULL')
      .getMany();

    const uniqueStudentIds = new Set(activeSubscriptions.map(sub => sub.student.id));
    const totalStudents = uniqueStudentIds.size;

    const recentStudents = activeSubscriptions
      .sort((a, b) => new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime())
      .slice(0, 5)
      .map(sub => ({
        id: sub.student.id,
        firstName: sub.student.firstName,
        lastName: sub.student.lastName,
        email: sub.student.email,
        urlAvatar: sub.student.urlAvatar,
        subscribedAt: DateTime.fromISO(sub.subscribedAt.toISOString()).toFormat(
          formatDateFrontend,
        ),
        pathName: sub.learningPath.name,
      }));

    const pathSubscriptionCounts = teacherPaths.map(path => ({
      id: path.id,
      name: path.name,
      code: path.code,
      studentsCount: path.subscriptions?.filter(sub => !sub.deletedAt).length || 0,
      coursesCount: path.courses?.length || 0,
    }));

    const topLearningPaths = pathSubscriptionCounts
      .sort((a, b) => b.studentsCount - a.studentsCount)
      .slice(0, 5);

    const recentCourses = await this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.chapters', 'chapters', 'chapters.deletedAt IS NULL')
      .where('course.createdBy.id = :teacherId', { teacherId })
      .andWhere('course.deletedAt IS NULL')
      .orderBy('course.createdAt', 'DESC')
      .limit(5)
      .getMany();

    const recentCoursesFormatted = recentCourses.map(course => ({
      id: course.id,
      title: course.title,
      code: course.code,
      urlLogo: course.urlLogo,
      chaptersCount: course.chapters?.length || 0,
      createdAt: DateTime.fromISO(course.createdAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
    }));

    const studentsByPath = pathSubscriptionCounts
      .filter(p => p.studentsCount > 0)
      .map(p => ({
        pathName: p.name,
        count: p.studentsCount,
      }));

    // --- NUEVAS MÉTRICAS DE ACTIVIDAD ---
    let averageAccuracy = 0;
    let averageScore = 0;
    let studentsAtRiskCount = 0;
    let lowPerformanceStudents = [];

    if (uniqueStudentIds.size > 0) {
      const studentIdsArray = Array.from(uniqueStudentIds);

      // 1. Promedios Globales (Accuracy y Score)
      const { avgAccuracy, avgScore } = await this.activityProgressRepo
        .createQueryBuilder('apu')
        .select('AVG(apu.accuracy)', 'avgAccuracy')
        .addSelect('AVG(apu.score)', 'avgScore')
        .where('apu.userId IN (:...ids)', { ids: studentIdsArray })
        .getRawOne();
      
      averageAccuracy = avgAccuracy ? parseFloat(Number(avgAccuracy).toFixed(1)) : 0;
      averageScore = avgScore ? parseFloat(Number(avgScore).toFixed(1)) : 0;

      // 2. Estudiantes en Riesgo (Accuracy < 70)
      // Agrupamos por estudiante para ver su promedio individual
      const studentsPerformance = await this.activityProgressRepo
        .createQueryBuilder('apu')
        .select('apu.userId', 'studentId')
        .addSelect('AVG(apu.accuracy)', 'avgAcc')
        .where('apu.userId IN (:...ids)', { ids: studentIdsArray })
        .groupBy('apu.userId')
        .having('AVG(apu.accuracy) < :umbral', { umbral: 70 }) 
        .getRawMany();
        
      studentsAtRiskCount = studentsPerformance.length;

      // Obtener detalles de los estudiantes en riesgo (top 5 más críticos)
      if (studentsAtRiskCount > 0) {
        const riskyStudentIds = studentsPerformance
          .sort((a, b) => a.avgAcc - b.avgAcc)
          .slice(0, 5)
          .map(s => s.studentId);
          
        // Buscamos sus datos en la lista de suscripciones que ya tenemos en memoria
        // para evitar otra query a UsersRepo
        lowPerformanceStudents = riskyStudentIds.map(id => {
          const sub = activeSubscriptions.find(s => s.student.id === id);
          const performance = studentsPerformance.find(p => p.studentId === id);
          if (sub) {
            return {
              id: sub.student.id,
              name: `${sub.student.firstName} ${sub.student.lastName}`,
              avatar: sub.student.urlAvatar,
              averageAccuracy: parseFloat(Number(performance.avgAcc).toFixed(1))
            };
          }
          return null;
        }).filter(s => s !== null);
      }
    }

    return {
      totalStudents,
      totalLearningPaths,
      totalCourses,
      activeSubscriptions: activeSubscriptions.length,
      averageAccuracy, // Reemplaza a Qualification
      averageScore,
      studentsAtRiskCount,
      lowPerformanceStudents, // Lista de estudiantes en riesgo
      recentStudents,
      topLearningPaths,
      recentCourses: recentCoursesFormatted,
      studentsByPath,
    };
  }

  async getStudentsList(teacherId: number): Promise<any[]> {
    const subscriptions = await this.subscriptionRepo
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.student', 'student')
      .leftJoinAndSelect('subscription.learningPath', 'learningPath')
      .where('learningPath.createdBy.id = :teacherId', { teacherId })
      .andWhere('subscription.deletedAt IS NULL')
      .andWhere('learningPath.deletedAt IS NULL')
      .orderBy('subscription.subscribedAt', 'DESC')
      .getMany();

    // Agrupar por estudiante
    const studentsMap = new Map();

    subscriptions.forEach(sub => {
      const studentId = sub.student.id;
      if (!studentsMap.has(studentId)) {
        studentsMap.set(studentId, {
          id: sub.student.id,
          firstName: sub.student.firstName,
          lastName: sub.student.lastName,
          email: sub.student.email,
          urlAvatar: sub.student.urlAvatar,
          yachay: sub.student.yachay || 0,
          paths: [],
        });
      }
      studentsMap.get(studentId).paths.push({
        id: sub.learningPath.id,
        name: sub.learningPath.name,
        code: sub.learningPath.code,
        subscribedAt: DateTime.fromISO(sub.subscribedAt.toISOString()).toFormat(
          formatDateFrontend,
        ),
      });
    });

    return Array.from(studentsMap.values());
  }
}
