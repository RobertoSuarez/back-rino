import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { LearningPath } from '../../database/entities/learningPath.entity';
import { LearningPathSubscription } from '../../database/entities/learningPathSubscription.entity';
import { Course } from '../../database/entities/course.entity';
import { User } from '../../database/entities/user.entity';
import {
  CreateLearningPathDto,
  UpdateLearningPathDto,
  LearningPathDto,
} from '../dtos/learning-path.dtos';
import { SubscribeToPathDto } from '../dtos/subscription.dtos';
import { DateTime } from 'luxon';
import { formatDateFrontend } from '../../common/constants';

@Injectable()
export class LearningPathService {
  constructor(
    @InjectRepository(LearningPath)
    private learningPathRepo: Repository<LearningPath>,
    @InjectRepository(LearningPathSubscription)
    private subscriptionRepo: Repository<LearningPathSubscription>,
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findAll(userId: number, typeUser: string): Promise<any[]> {
    // Usar QueryBuilder para filtrar cursos eliminados
    let query = this.learningPathRepo
      .createQueryBuilder('learningPath')
      .leftJoinAndSelect('learningPath.createdBy', 'createdBy')
      .leftJoinAndSelect('learningPath.courses', 'courses', 'courses.deletedAt IS NULL')
      .where('learningPath.deletedAt IS NULL');
    
    // Si es profesor, solo mostrar sus rutas
    if (typeUser === 'teacher') {
      query = query.andWhere('createdBy.id = :userId', { userId });
    }
    
    const learningPaths = await query
      .orderBy('learningPath.createdAt', 'DESC')
      .getMany();

    return learningPaths.map((lp) => ({
      id: lp.id,
      name: lp.name,
      code: lp.code,
      description: lp.description,
      isActive: lp.isActive,
      coursesCount: lp.courses?.length || 0,
      courses: lp.courses?.map((course) => ({
        id: course.id,
        title: course.title,
        code: course.code,
        urlLogo: course.urlLogo,
      })) || [],
      createdBy: lp.createdBy ? {
        id: lp.createdBy.id,
        firstName: lp.createdBy.firstName,
        lastName: lp.createdBy.lastName,
      } : null,
      createdAt: DateTime.fromISO(lp.createdAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
      updatedAt: DateTime.fromISO(lp.updatedAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
    }));
  }

  async findOne(id: number): Promise<any> {
    // Usar QueryBuilder para filtrar cursos eliminados
    const learningPath = await this.learningPathRepo
      .createQueryBuilder('learningPath')
      .leftJoinAndSelect('learningPath.createdBy', 'createdBy')
      .leftJoinAndSelect('learningPath.courses', 'courses', 'courses.deletedAt IS NULL')
      .where('learningPath.id = :id', { id })
      .andWhere('learningPath.deletedAt IS NULL')
      .getOne();

    if (!learningPath) {
      throw new Error('Ruta de aprendizaje no encontrada');
    }

    return {
      id: learningPath.id,
      name: learningPath.name,
      code: learningPath.code,
      description: learningPath.description,
      isActive: learningPath.isActive,
      courses: learningPath.courses?.map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        code: course.code,
        urlLogo: course.urlLogo,
      })) || [],
      createdBy: learningPath.createdBy ? {
        id: learningPath.createdBy.id,
        firstName: learningPath.createdBy.firstName,
        lastName: learningPath.createdBy.lastName,
      } : null,
      createdAt: DateTime.fromISO(learningPath.createdAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
      updatedAt: DateTime.fromISO(learningPath.updatedAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
    };
  }

  async create(payload: CreateLearningPathDto, userId: number): Promise<any> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Buscar los cursos
    const courses = await this.courseRepo.find({
      where: {
        id: In(payload.courseIds),
        deletedAt: IsNull(),
      },
    });

    if (courses.length !== payload.courseIds.length) {
      throw new Error('Algunos cursos no fueron encontrados');
    }

    // Generar código único para la ruta
    const code = await this.generateUniqueCode();

    const learningPath = new LearningPath();
    learningPath.name = payload.name;
    learningPath.code = code;
    learningPath.description = payload.description;
    learningPath.isActive = payload.isActive !== undefined ? payload.isActive : true;
    learningPath.createdBy = user;
    learningPath.courses = courses;

    const saved = await this.learningPathRepo.save(learningPath);

    return {
      id: saved.id,
      name: saved.name,
      code: saved.code,
      description: saved.description,
      isActive: saved.isActive,
      courses: courses.map((course) => ({
        id: course.id,
        title: course.title,
        code: course.code,
      })),
      createdAt: DateTime.fromISO(saved.createdAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
      updatedAt: DateTime.fromISO(saved.updatedAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
    };
  }

  async update(
    id: number,
    payload: UpdateLearningPathDto,
    userId: number,
    typeUser: string,
  ): Promise<any> {
    const learningPath = await this.learningPathRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['courses', 'createdBy'],
    });

    if (!learningPath) {
      throw new Error('Ruta de aprendizaje no encontrada');
    }

    // Verificar permisos: si es profesor, solo puede editar sus propias rutas
    if (typeUser === 'teacher' && learningPath.createdBy?.id !== userId) {
      throw new Error('No tienes permisos para editar esta ruta de aprendizaje');
    }

    // Actualizar campos básicos
    if (payload.name) learningPath.name = payload.name;
    if (payload.description) learningPath.description = payload.description;
    if (payload.isActive !== undefined) learningPath.isActive = payload.isActive;

    // Actualizar cursos si se proporcionan
    if (payload.courseIds) {
      const courses = await this.courseRepo.find({
        where: {
          id: In(payload.courseIds),
          deletedAt: IsNull(),
        },
      });

      if (courses.length !== payload.courseIds.length) {
        throw new Error('Algunos cursos no fueron encontrados');
      }

      learningPath.courses = courses;
    }

    const saved = await this.learningPathRepo.save(learningPath);

    return {
      id: saved.id,
      name: saved.name,
      code: saved.code,
      description: saved.description,
      isActive: saved.isActive,
      courses: saved.courses?.map((course) => ({
        id: course.id,
        title: course.title,
        code: course.code,
      })) || [],
      updatedAt: DateTime.fromISO(saved.updatedAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
    };
  }

  /**
   * Genera un código único para la ruta de aprendizaje
   * Formato: LP-YYYYMMDD-XXXX (LP = Learning Path, XXXX = número secuencial)
   */
  private async generateUniqueCode(): Promise<string> {
    const today = DateTime.now().toFormat('yyyyMMdd');
    const prefix = `LP-${today}`;
    
    // Buscar el último código generado hoy
    const lastPath = await this.learningPathRepo
      .createQueryBuilder('learningPath')
      .where('learningPath.code LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('learningPath.code', 'DESC')
      .getOne();
    
    let sequence = 1;
    if (lastPath && lastPath.code) {
      // Extraer el número secuencial del último código
      const lastSequence = parseInt(lastPath.code.split('-')[2], 10);
      sequence = lastSequence + 1;
    }
    
    // Formatear el número secuencial con ceros a la izquierda (4 dígitos)
    const sequenceStr = sequence.toString().padStart(4, '0');
    
    return `${prefix}-${sequenceStr}`;
  }

  async delete(id: number, userId: number, typeUser: string): Promise<void> {
    const learningPath = await this.learningPathRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['createdBy'],
    });

    if (!learningPath) {
      throw new Error('Ruta de aprendizaje no encontrada');
    }

    // Verificar permisos: si es profesor, solo puede eliminar sus propias rutas
    if (typeUser === 'teacher' && learningPath.createdBy?.id !== userId) {
      throw new Error('No tienes permisos para eliminar esta ruta de aprendizaje');
    }

    await this.learningPathRepo.softDelete(id);
  }

  /**
   * Migración: Genera códigos para rutas existentes sin código
   */
  async generateCodesForExistingPaths(): Promise<void> {
    const pathsWithoutCode = await this.learningPathRepo.find({
      where: { code: IsNull(), deletedAt: IsNull() },
    });

    for (const path of pathsWithoutCode) {
      const code = await this.generateUniqueCode();
      path.code = code;
      await this.learningPathRepo.save(path);
    }
  }

  // ==================== MÉTODOS PARA ESTUDIANTES ====================

  /**
   * Suscribe a un estudiante a una ruta de aprendizaje usando el código
   */
  async subscribeToPath(userId: number, payload: SubscribeToPathDto): Promise<any> {
    // Buscar la ruta por código
    const learningPath = await this.learningPathRepo.findOne({
      where: { code: payload.code, deletedAt: IsNull(), isActive: true },
      relations: ['createdBy'],
    });

    if (!learningPath) {
      throw new Error('Ruta de aprendizaje no encontrada o inactiva');
    }

    // Buscar suscripción existente incluyendo soft-deleted para evitar duplicate key.
    const existingSubscription = await this.subscriptionRepo.findOne({
      where: {
        student: { id: userId },
        learningPath: { id: learningPath.id },
      },
      withDeleted: true,
    });

    if (existingSubscription && !existingSubscription.deletedAt) {
      throw new Error('Ya estás suscrito a esta ruta de aprendizaje');
    }

    let saved: LearningPathSubscription;

    if (existingSubscription?.deletedAt) {
      // Reactivar suscripción eliminada lógicamente.
      await this.subscriptionRepo.restore(existingSubscription.id);

      existingSubscription.subscribedAt = new Date();
      existingSubscription.isActive = true;
      existingSubscription.deletedAt = null;

      saved = await this.subscriptionRepo.save(existingSubscription);
    } else {
      // Crear suscripción nueva.
      const subscription = new LearningPathSubscription();
      subscription.student = await this.userRepo.findOneBy({ id: userId });
      subscription.learningPath = learningPath;
      subscription.isActive = true;
      subscription.subscribedAt = new Date();

      saved = await this.subscriptionRepo.save(subscription);
    }

    return {
      id: saved.id,
      message: 'Suscripción exitosa',
      learningPath: {
        id: learningPath.id,
        name: learningPath.name,
        code: learningPath.code,
        description: learningPath.description,
      },
      subscribedAt: DateTime.fromISO(saved.subscribedAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
    };
  }

  /**
   * Obtiene todas las rutas a las que está suscrito un estudiante
   */
  async getMySubscriptions(userId: number): Promise<any[]> {
    const subscriptions = await this.subscriptionRepo
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.learningPath', 'learningPath')
      .leftJoinAndSelect('learningPath.createdBy', 'createdBy')
      .leftJoinAndSelect('learningPath.courses', 'courses', 'courses.deletedAt IS NULL')
      .where('subscription.student.id = :userId', { userId })
      .andWhere('subscription.deletedAt IS NULL')
      .andWhere('learningPath.deletedAt IS NULL')
      .orderBy('subscription.subscribedAt', 'DESC')
      .getMany();

    return subscriptions.map((sub) => ({
      id: sub.id,
      learningPath: {
        id: sub.learningPath.id,
        name: sub.learningPath.name,
        code: sub.learningPath.code,
        description: sub.learningPath.description,
        coursesCount: sub.learningPath.courses?.length || 0,
        createdBy: sub.learningPath.createdBy ? {
          id: sub.learningPath.createdBy.id,
          firstName: sub.learningPath.createdBy.firstName,
          lastName: sub.learningPath.createdBy.lastName,
        } : null,
      },
      subscribedAt: DateTime.fromISO(sub.subscribedAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
      isActive: sub.isActive,
    }));
  }

  /**
   * Obtiene el detalle completo de una ruta con toda su información
   */
  async getPathDetailForStudent(pathId: number, userId: number): Promise<any> {
    // Verificar que el estudiante esté suscrito
    const subscription = await this.subscriptionRepo.findOne({
      where: {
        student: { id: userId },
        learningPath: { id: pathId },
        deletedAt: IsNull(),
      },
    });

    if (!subscription) {
      throw new Error('No estás suscrito a esta ruta de aprendizaje');
    }

    // Obtener la ruta con toda la información
    const learningPath = await this.learningPathRepo
      .createQueryBuilder('learningPath')
      .leftJoinAndSelect('learningPath.createdBy', 'createdBy')
      .leftJoinAndSelect('learningPath.courses', 'courses', 'courses.deletedAt IS NULL')
      .leftJoinAndSelect('courses.chapters', 'chapters', 'chapters.deletedAt IS NULL')
      .leftJoinAndSelect('chapters.temas', 'temas', 'temas.deletedAt IS NULL')
      .leftJoinAndSelect('temas.activities', 'activities', 'activities.deletedAt IS NULL')
      .leftJoinAndSelect('learningPath.subscriptions', 'subscriptions', 'subscriptions.deletedAt IS NULL')
      .leftJoinAndSelect('subscriptions.student', 'students')
      .where('learningPath.id = :pathId', { pathId })
      .andWhere('learningPath.deletedAt IS NULL')
      .getOne();

    if (!learningPath) {
      throw new Error('Ruta de aprendizaje no encontrada');
    }

    return {
      id: learningPath.id,
      name: learningPath.name,
      code: learningPath.code,
      description: learningPath.description,
      isActive: learningPath.isActive,
      createdBy: learningPath.createdBy ? {
        id: learningPath.createdBy.id,
        firstName: learningPath.createdBy.firstName,
        lastName: learningPath.createdBy.lastName,
        urlAvatar: learningPath.createdBy.urlAvatar,
      } : null,
      courses: learningPath.courses?.map((course) => ({
        id: course.id,
        title: course.title,
        code: course.code,
        description: course.description,
        urlLogo: course.urlLogo,
        chaptersCount: course.chapters?.length || 0,
        chapters: course.chapters?.map((chapter) => ({
          id: chapter.id,
          title: chapter.title,
          temasCount: chapter.temas?.length || 0,
          temas: chapter.temas?.map((tema) => ({
            id: tema.id,
            title: tema.title,
            activitiesCount: tema.activities?.length || 0,
          })) || [],
        })) || [],
      })) || [],
      studentsCount: learningPath.subscriptions?.length || 0,
      students: learningPath.subscriptions?.slice(0, 10).map((sub) => ({
        id: sub.student.id,
        firstName: sub.student.firstName,
        lastName: sub.student.lastName,
        urlAvatar: sub.student.urlAvatar,
      })) || [],
      createdAt: DateTime.fromISO(learningPath.createdAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
      updatedAt: DateTime.fromISO(learningPath.updatedAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
    };
  }

  /**
   * Cancela la suscripción de un estudiante a una ruta
   */
  async unsubscribeFromPath(pathId: number, userId: number): Promise<void> {
    const subscription = await this.subscriptionRepo.findOne({
      where: {
        student: { id: userId },
        learningPath: { id: pathId },
        deletedAt: IsNull(),
      },
    });

    if (!subscription) {
      throw new Error('No estás suscrito a esta ruta de aprendizaje');
    }

    subscription.isActive = false;
    await this.subscriptionRepo.save(subscription);
    await this.subscriptionRepo.softDelete(subscription.id);
  }
}
