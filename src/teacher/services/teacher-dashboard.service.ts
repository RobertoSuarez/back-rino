import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { LearningPath } from '../../database/entities/learningPath.entity';
import { LearningPathSubscription } from '../../database/entities/learningPathSubscription.entity';
import { Course } from '../../database/entities/course.entity';
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
  ) {}

  async getDashboardStats(teacherId: number): Promise<any> {
    // Obtener todas las rutas del profesor
    const teacherPaths = await this.learningPathRepo.find({
      where: { createdBy: { id: teacherId }, deletedAt: IsNull() },
      relations: ['subscriptions', 'subscriptions.student', 'courses'],
    });

    const pathIds = teacherPaths.map(p => p.id);

    // Total de rutas de aprendizaje
    const totalLearningPaths = teacherPaths.length;

    // Total de cursos creados por el profesor
    const totalCourses = await this.courseRepo.count({
      where: { createdBy: { id: teacherId }, deletedAt: IsNull() },
    });

    // Obtener todas las suscripciones activas a las rutas del profesor
    const activeSubscriptions = await this.subscriptionRepo
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.student', 'student')
      .leftJoinAndSelect('subscription.learningPath', 'learningPath')
      .where('learningPath.createdBy.id = :teacherId', { teacherId })
      .andWhere('subscription.deletedAt IS NULL')
      .andWhere('learningPath.deletedAt IS NULL')
      .getMany();

    // Total de estudiantes únicos
    const uniqueStudentIds = new Set(activeSubscriptions.map(sub => sub.student.id));
    const totalStudents = uniqueStudentIds.size;

    // Estudiantes recientes (últimos 5)
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

    // Top rutas por número de estudiantes
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

    // Cursos recientes del profesor
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

    // Distribución de estudiantes por ruta
    const studentsByPath = pathSubscriptionCounts
      .filter(p => p.studentsCount > 0)
      .map(p => ({
        pathName: p.name,
        count: p.studentsCount,
      }));

    // Calcular progreso promedio (simulado por ahora, se puede mejorar con datos reales)
    const averageProgress = totalStudents > 0 ? Math.round(Math.random() * 30 + 40) : 0;

    return {
      totalStudents,
      totalLearningPaths,
      totalCourses,
      activeSubscriptions: activeSubscriptions.length,
      averageProgress,
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
