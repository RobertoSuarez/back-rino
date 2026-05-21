import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In, Not } from 'typeorm';
import { LearningPath } from '../../database/entities/learningPath.entity';
import { LearningPathSubscription } from '../../database/entities/learningPathSubscription.entity';
import { Course } from '../../database/entities/course.entity';
import { ActivityProgressUser } from '../../database/entities/activityProgress.entity';
import { Activity } from '../../database/entities/activity.entity';
import { Chapter } from '../../database/entities/chapter.entity';
import { Tema } from '../../database/entities/tema.entity';
import { User } from '../../database/entities/user.entity';
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
    @InjectRepository(Activity)
    private activityRepo: Repository<Activity>,
    @InjectRepository(Chapter)
    private chapterRepo: Repository<Chapter>,
    @InjectRepository(Tema)
    private temaRepo: Repository<Tema>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
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

  async getStudentDetail(teacherId: number, studentId: number): Promise<any> {
    // 1. Verificar que el estudiante pertenece a alguna ruta del docente
    const subscriptions = await this.subscriptionRepo
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.student', 'student')
      .leftJoinAndSelect('sub.learningPath', 'lp')
      .where('lp.createdBy.id = :teacherId', { teacherId })
      .andWhere('sub.student.id = :studentId', { studentId })
      .andWhere('sub.deletedAt IS NULL')
      .andWhere('lp.deletedAt IS NULL')
      .getMany();

    if (subscriptions.length === 0) {
      return null;
    }

    const student = subscriptions[0].student;

    // 2. Para cada ruta, obtener cursos → capítulos → temas → actividades
    const pathsDetail = await Promise.all(
      subscriptions.map(async (sub) => {
        const path = sub.learningPath;

        // Cursos de la ruta con toda la jerarquía
        const courses = await this.courseRepo
          .createQueryBuilder('course')
          .innerJoin('learning_path_courses', 'lpc', 'lpc.course_id = course.id')
          .leftJoinAndSelect('course.chapters', 'chapter', 'chapter.deletedAt IS NULL')
          .leftJoinAndSelect('chapter.temas', 'tema', 'tema.deletedAt IS NULL')
          .leftJoinAndSelect('tema.activities', 'activity', 'activity.deletedAt IS NULL')
          .where('lpc.learning_path_id = :pathId', { pathId: path.id })
          .andWhere('course.deletedAt IS NULL')
          .orderBy('chapter.index', 'ASC')
          .addOrderBy('tema.index', 'ASC')
          .addOrderBy('activity.index', 'ASC')
          .getMany();

        // IDs de todas las actividades de la ruta
        const allActivityIds: number[] = [];
        for (const course of courses) {
          for (const chapter of (course.chapters || [])) {
            for (const tema of (chapter.temas || [])) {
              for (const activity of (tema.activities || [])) {
                allActivityIds.push(activity.id);
              }
            }
          }
        }

        // Progreso del alumno en esas actividades (mejor intento ya guardado)
        const progressMap = new Map<number, { accuracy: number; score: number; progress: number }>();
        if (allActivityIds.length > 0) {
          const progresses = await this.activityProgressRepo.find({
            where: {
              activity: { id: In(allActivityIds) },
              user: { id: studentId },
            },
            relations: ['activity'],
          });
          progresses.forEach((p) => {
            progressMap.set(p.activity.id, {
              accuracy: p.accuracy,
              score: p.score,
              progress: p.progress,
            });
          });
        }

        // Calcular nota sugerida de la ruta: SUM(accuracy) / totalActivities / 10
        const totalActivities = allActivityIds.length;
        let sumAccuracy = 0;
        progressMap.forEach((p) => { sumAccuracy += p.accuracy; });
        const suggestedGrade = totalActivities > 0
          ? parseFloat((sumAccuracy / totalActivities / 10).toFixed(2))
          : 0;

        // Construir la estructura jerárquica con rendimiento
        const coursesWithProgress = courses.map((course) => ({
          id: course.id,
          title: course.title,
          code: course.code,
          chapters: (course.chapters || []).map((chapter) => ({
            id: chapter.id,
            title: chapter.title,
            difficulty: chapter.difficulty,
            temas: (chapter.temas || []).map((tema) => ({
              id: tema.id,
              title: tema.title,
              activities: (tema.activities || []).map((activity) => {
                const prog = progressMap.get(activity.id);
                return {
                  id: activity.id,
                  title: activity.title,
                  done: !!prog,
                  accuracy: prog?.accuracy ?? null,
                  score: prog?.score ?? null,
                  progress: prog?.progress ?? 0,
                  status: !prog
                    ? 'not_started'
                    : prog.accuracy >= 60
                    ? 'passed'
                    : 'needs_improvement',
                };
              }),
            })),
          })),
        }));

        // Actividades débiles: no iniciadas o accuracy < 60
        const weakActivities = allActivityIds
          .filter((id) => {
            const p = progressMap.get(id);
            return !p || p.accuracy < 60;
          })
          .length;

        return {
          pathId: path.id,
          pathName: path.name,
          pathCode: path.code,
          subscribedAt: DateTime.fromISO(sub.subscribedAt.toISOString()).toFormat(formatDateFrontend),
          totalActivities,
          completedActivities: progressMap.size,
          weakActivities,
          suggestedGrade,
          courses: coursesWithProgress,
        };
      })
    );

    // 3. Accuracy global del alumno en todas las rutas del docente
    const allPathActivityIds: number[] = pathsDetail.flatMap(
      (p) => p.courses.flatMap((c) =>
        c.chapters.flatMap((ch) =>
          ch.temas.flatMap((t) =>
            t.activities.map((a) => a.id)
          )
        )
      )
    );

    let globalAccuracy = 0;
    if (allPathActivityIds.length > 0) {
      const { avg } = await this.activityProgressRepo
        .createQueryBuilder('apu')
        .select('AVG(apu.accuracy)', 'avg')
        .where('apu.activity.id IN (:...ids)', { ids: allPathActivityIds })
        .andWhere('apu.user.id = :studentId', { studentId })
        .getRawOne();
      globalAccuracy = avg ? parseFloat(Number(avg).toFixed(1)) : 0;
    }

    const globalSuggestedGrade = parseFloat((globalAccuracy / 10).toFixed(2));

    return {
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        urlAvatar: student.urlAvatar,
        yachay: student.yachay,
      },
      globalAccuracy,
      globalSuggestedGrade,
      paths: pathsDetail,
    };
  }
}
