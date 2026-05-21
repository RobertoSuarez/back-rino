import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
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

const RISK_THRESHOLD = 70;

type StudentPerformance = {
  globalAccuracy: number | null;
  averageScore: number | null;
  globalSuggestedGrade: number | null;
  hasEvaluableProgress: boolean;
  evaluableActivitiesCount: number;
  completedEvaluableActivitiesCount: number;
};

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
    const teacherPaths = await this.learningPathRepo.find({
      where: { createdBy: { id: teacherId }, deletedAt: IsNull() },
      relations: ['subscriptions', 'subscriptions.student', 'courses'],
    });

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
    const performanceMap = await this.getPerformanceByStudent(activeSubscriptions);

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

    const performances = Array.from(performanceMap.values()).filter(p => p.hasEvaluableProgress);
    const averageAccuracy = performances.length > 0
      ? this.round1(performances.reduce((sum, p) => sum + (p.globalAccuracy ?? 0), 0) / performances.length)
      : null;
    const averageScore = performances.length > 0
      ? this.round1(performances.reduce((sum, p) => sum + (p.averageScore ?? 0), 0) / performances.length)
      : null;

    const riskyStudents = Array.from(uniqueStudentIds)
      .map((id) => {
        const sub = activeSubscriptions.find(s => s.student.id === id);
        const performance = performanceMap.get(id);
        if (!sub || !performance?.hasEvaluableProgress || performance.globalAccuracy === null || performance.globalAccuracy >= RISK_THRESHOLD) {
          return null;
        }
        return {
          id: sub.student.id,
          name: `${sub.student.firstName} ${sub.student.lastName}`,
          avatar: sub.student.urlAvatar,
          averageAccuracy: performance.globalAccuracy,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.averageAccuracy - b.averageAccuracy);

    return {
      totalStudents,
      totalLearningPaths,
      totalCourses,
      activeSubscriptions: activeSubscriptions.length,
      averageAccuracy,
      averageScore,
      studentsAtRiskCount: riskyStudents.length,
      lowPerformanceStudents: riskyStudents.slice(0, 5),
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

    const studentsMap = new Map();
    const performanceMap = await this.getPerformanceByStudent(subscriptions);

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
          globalAccuracy: performanceMap.get(studentId)?.globalAccuracy ?? null,
          globalSuggestedGrade: performanceMap.get(studentId)?.globalSuggestedGrade ?? null,
          hasEvaluableProgress: performanceMap.get(studentId)?.hasEvaluableProgress ?? false,
          evaluableActivitiesCount: performanceMap.get(studentId)?.evaluableActivitiesCount ?? 0,
          completedEvaluableActivitiesCount: performanceMap.get(studentId)?.completedEvaluableActivitiesCount ?? 0,
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
          .leftJoinAndSelect('activity.exercises', 'exercise', 'exercise.deletedAt IS NULL')
          .where('lpc.learning_path_id = :pathId', { pathId: path.id })
          .andWhere('course.deletedAt IS NULL')
          .orderBy('chapter.index', 'ASC')
          .addOrderBy('tema.index', 'ASC')
          .addOrderBy('activity.index', 'ASC')
          .getMany();

        const allActivityIds: number[] = [];
        for (const course of courses) {
          for (const chapter of (course.chapters || [])) {
            for (const tema of (chapter.temas || [])) {
              for (const activity of (tema.activities || [])) {
                if ((activity.exercises || []).length > 0) {
                  allActivityIds.push(activity.id);
                }
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
              activities: (tema.activities || [])
                .filter((activity) => (activity.exercises || []).length > 0)
                .map((activity) => {
                const prog = progressMap.get(activity.id);
                return {
                  id: activity.id,
                  title: activity.title,
                  totalExercises: (activity.exercises || []).length,
                  done: !!prog,
                  accuracy: prog?.accuracy ?? null,
                  score: prog?.score ?? null,
                  progress: prog?.progress ?? 0,
                  status: !prog
                    ? 'not_started'
                    : prog.accuracy >= RISK_THRESHOLD
                    ? 'passed'
                    : 'needs_improvement',
                };
              }),
            })),
          })),
        }));

        const weakActivities = allActivityIds
          .filter((id) => {
            const p = progressMap.get(id);
            return !p || p.accuracy < RISK_THRESHOLD;
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

    let globalAccuracy: number | null = null;
    let globalSuggestedGrade: number | null = null;
    if (allPathActivityIds.length > 0) {
      const { avg, sum } = await this.activityProgressRepo
        .createQueryBuilder('apu')
        .select('AVG(apu.accuracy)', 'avg')
        .addSelect('SUM(apu.accuracy)', 'sum')
        .where('apu.activity.id IN (:...ids)', { ids: allPathActivityIds })
        .andWhere('apu.user.id = :studentId', { studentId })
        .getRawOne();
      globalAccuracy = avg ? this.round1(Number(avg)) : null;
      globalSuggestedGrade = sum
        ? parseFloat((Number(sum) / allPathActivityIds.length / 10).toFixed(2))
        : 0;
    }

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

  private async getPerformanceByStudent(
    subscriptions: LearningPathSubscription[],
  ): Promise<Map<number, StudentPerformance>> {
    const studentActivityIds = await this.getEvaluableActivityIdsByStudent(subscriptions);
    const studentIds = Array.from(studentActivityIds.keys());
    const allActivityIds = Array.from(
      new Set(Array.from(studentActivityIds.values()).flatMap((ids) => Array.from(ids))),
    );

    const result = new Map<number, StudentPerformance>();
    studentActivityIds.forEach((activityIds, studentId) => {
      result.set(studentId, {
        globalAccuracy: null,
        averageScore: null,
        globalSuggestedGrade: null,
        hasEvaluableProgress: false,
        evaluableActivitiesCount: activityIds.size,
        completedEvaluableActivitiesCount: 0,
      });
    });

    if (studentIds.length === 0 || allActivityIds.length === 0) {
      return result;
    }

    const progresses = await this.activityProgressRepo.find({
      where: {
        user: { id: In(studentIds) },
        activity: { id: In(allActivityIds) },
      },
      relations: ['user', 'activity'],
    });

    const accum = new Map<number, { sumAccuracy: number; sumScore: number; count: number }>();
    progresses.forEach((progress) => {
      const studentId = progress.user?.id;
      const activityId = progress.activity?.id;
      if (!studentId || !activityId || !studentActivityIds.get(studentId)?.has(activityId)) {
        return;
      }
      const current = accum.get(studentId) || { sumAccuracy: 0, sumScore: 0, count: 0 };
      current.sumAccuracy += progress.accuracy ?? 0;
      current.sumScore += progress.score ?? 0;
      current.count += 1;
      accum.set(studentId, current);
    });

    accum.forEach((value, studentId) => {
      const base = result.get(studentId);
      if (!base) return;
      base.completedEvaluableActivitiesCount = value.count;
      base.hasEvaluableProgress = value.count > 0;
      base.globalAccuracy = value.count > 0 ? this.round1(value.sumAccuracy / value.count) : null;
      base.averageScore = value.count > 0 ? this.round1(value.sumScore / value.count) : null;
      base.globalSuggestedGrade = base.evaluableActivitiesCount > 0
        ? parseFloat((value.sumAccuracy / base.evaluableActivitiesCount / 10).toFixed(2))
        : null;
    });

    return result;
  }

  private async getEvaluableActivityIdsByStudent(
    subscriptions: LearningPathSubscription[],
  ): Promise<Map<number, Set<number>>> {
    const pathIds = Array.from(new Set(subscriptions.map((sub) => sub.learningPath.id)));
    const rows = await this.getEvaluableActivityRowsByPathIds(pathIds);
    const activityIdsByPath = new Map<number, number[]>();
    rows.forEach((row) => {
      const pathId = Number(row.path_id);
      const activityId = Number(row.activity_id);
      activityIdsByPath.set(pathId, [...(activityIdsByPath.get(pathId) || []), activityId]);
    });

    const studentActivityIds = new Map<number, Set<number>>();
    subscriptions.forEach((sub) => {
      const studentId = sub.student.id;
      if (!studentActivityIds.has(studentId)) {
        studentActivityIds.set(studentId, new Set<number>());
      }
      (activityIdsByPath.get(sub.learningPath.id) || []).forEach((activityId) => {
        studentActivityIds.get(studentId)!.add(activityId);
      });
    });
    return studentActivityIds;
  }

  private async getEvaluableActivityRowsByPathIds(
    pathIds: number[],
  ): Promise<Array<{ path_id: number; activity_id: number }>> {
    if (pathIds.length === 0) return [];
    const placeholders = pathIds.map((_, index) => `$${index + 1}`).join(', ');
    return this.activityRepo.manager.query(
      `SELECT DISTINCT lpc.learning_path_id AS path_id, a.id AS activity_id
       FROM learning_path_courses lpc
       INNER JOIN course c ON c.id = lpc.course_id
       INNER JOIN chapter ch ON ch."courseId" = c.id
       INNER JOIN tema t ON t."chapterId" = ch.id
       INNER JOIN activity a ON a."temaId" = t.id
       INNER JOIN exercise e ON e."activityId" = a.id
       WHERE lpc.learning_path_id IN (${placeholders})
         AND c."deletedAt" IS NULL
         AND ch."deletedAt" IS NULL
         AND t."deletedAt" IS NULL
         AND a."deletedAt" IS NULL
         AND e."deletedAt" IS NULL`,
      pathIds,
    );
  }

  private round1(value: number): number {
    return parseFloat(Number(value).toFixed(1));
  }
}
