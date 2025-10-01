import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Course } from '../../database/entities/course.entity';
import { LearningPath } from '../../database/entities/learningPath.entity';
import { LearningPathSubscription } from '../../database/entities/learningPathSubscription.entity';
import { DateTime } from 'luxon';
import { formatDateFrontend } from '../../common/constants';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
    @InjectRepository(LearningPath)
    private learningPathRepo: Repository<LearningPath>,
    @InjectRepository(LearningPathSubscription)
    private subscriptionRepo: Repository<LearningPathSubscription>,
  ) {}

  async getDashboardStats(): Promise<any> {
    // Estadísticas de usuarios
    const totalUsers = await this.userRepo.count({ where: { deletedAt: IsNull() } });
    const totalAdmins = await this.userRepo.count({
      where: { typeUser: 'admin', deletedAt: IsNull() },
    });
    const totalTeachers = await this.userRepo.count({
      where: { typeUser: 'teacher', deletedAt: IsNull() },
    });
    const totalStudents = await this.userRepo.count({
      where: { typeUser: 'student', deletedAt: IsNull() },
    });
    const activeUsers = await this.userRepo.count({
      where: { status: 'active', deletedAt: IsNull() },
    });
    const verifiedUsers = await this.userRepo.count({
      where: { isVerified: true, deletedAt: IsNull() },
    });
    const approvedUsers = await this.userRepo.count({
      where: { approved: true, deletedAt: IsNull() },
    });

    // Usuarios recientes (últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await this.userRepo.count({
      where: {
        deletedAt: IsNull(),
      },
    });

    // Estadísticas de contenido
    const totalCourses = await this.courseRepo.count({ where: { deletedAt: IsNull() } });
    const totalLearningPaths = await this.learningPathRepo.count({
      where: { deletedAt: IsNull() },
    });
    const totalChapters = 0; // Placeholder - agregar cuando la entidad esté disponible
    const totalTemas = 0; // Placeholder - agregar cuando la entidad esté disponible
    const totalActivities = 0; // Placeholder - agregar cuando la entidad esté disponible

    // Estadísticas de suscripciones
    const totalSubscriptions = await this.subscriptionRepo.count({
      where: { deletedAt: IsNull() },
    });
    const activeSubscriptions = await this.subscriptionRepo.count({
      where: { isActive: true, deletedAt: IsNull() },
    });

    // Usuarios recientes (últimos 5)
    const latestUsers = await this.userRepo.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const recentUsersFormatted = latestUsers.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      typeUser: user.typeUser,
      urlAvatar: user.urlAvatar,
      status: user.status,
      createdAt: DateTime.fromISO(user.createdAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
    }));

    // Cursos recientes (últimos 5) - simplificado
    const latestCourses = await this.courseRepo.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const recentCoursesFormatted = latestCourses.map(course => ({
      id: course.id,
      title: course.title,
      code: course.code,
      urlLogo: course.urlLogo,
      createdBy: null, // Simplificado
      createdAt: DateTime.fromISO(course.createdAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
    }));

    // Rutas de aprendizaje más populares (simplificado)
    const allPaths = await this.learningPathRepo.find({
      where: { deletedAt: IsNull() },
      take: 5,
      order: { createdAt: 'DESC' },
    });

    const popularPathsFormatted = allPaths.map((path: any) => ({
      id: path.id,
      name: path.name,
      code: path.code,
      subscriptionsCount: 0, // Placeholder
      createdBy: null,
    }));

    // Distribución de usuarios por tipo
    const usersByType = [
      { type: 'Administradores', count: totalAdmins },
      { type: 'Profesores', count: totalTeachers },
      { type: 'Estudiantes', count: totalStudents },
    ];

    // Estadísticas de contenido por categoría
    const contentStats = [
      { category: 'Cursos', count: totalCourses },
      { category: 'Rutas', count: totalLearningPaths },
      { category: 'Capítulos', count: totalChapters },
      { category: 'Temas', count: totalTemas },
      { category: 'Actividades', count: totalActivities },
    ];

    return {
      users: {
        total: totalUsers,
        admins: totalAdmins,
        teachers: totalTeachers,
        students: totalStudents,
        active: activeUsers,
        verified: verifiedUsers,
        approved: approvedUsers,
        recent: recentUsers,
      },
      content: {
        courses: totalCourses,
        learningPaths: totalLearningPaths,
        chapters: totalChapters,
        temas: totalTemas,
        activities: totalActivities,
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
      },
      recentUsers: recentUsersFormatted,
      recentCourses: recentCoursesFormatted,
      popularPaths: popularPathsFormatted,
      usersByType,
      contentStats,
    };
  }
}
