import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { DateTime } from 'luxon';
import { formatDateFrontend } from '../../../common/constants';
import {
  CourseWithProgressDto,
  CreateCourseDto,
  UpdateCourseDto,
} from '../../../course/dtos/courses.dto';
import { Chapter } from '../../../database/entities/chapter.entity';
import { ChapterProgressUser } from '../../../database/entities/chapterProgressUser.entity';
import { Course } from '../../../database/entities/course.entity';
import { User } from '../../../database/entities/user.entity';
import { Brackets, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Chapter) private chapterRepo: Repository<Chapter>,
    @InjectRepository(ChapterProgressUser)
    private chapterProgressRepo: Repository<ChapterProgressUser>,
  ) {}

  async findAll() {
    const courses = await this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.createdBy', 'createdBy')
      .leftJoinAndSelect('course.chapters', 'chapters')
      .where('course.deletedAt IS NULL AND course.isPublic = true')
      .orderBy('course.index', 'ASC')
      .getMany();

    const result = courses.map((course) => ({
      id: course.id,
      title: course.title,
      createdBy: course.createdBy.firstName + ' ' + course.createdBy.lastName,
      chapters: `${course.chapters.length} capítulos`,
      code: course.code,
      urlLogo: course.urlLogo,
      index: course.index,
      isPublic: course.isPublic,
      createAt: DateTime.fromISO(course.createdAt.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
      updatedAt: DateTime.fromISO(course.updatedAt.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
    }));

    return result;
  }

  async findCourseById(courseId: number) {
    const course = await this.courseRepo.findOneBy({ id: courseId });
    if (!course) {
      throw new Error('Course not found');
    }
    return course;
  }

  async findCourseForTeacher(userId: number) {
    // id, title, Cantidad de capítulos, Creado por, Fecha de creación, fecha de actualización, Acciones.
    // const courses = await this.courseRepo
    //   .createQueryBuilder('course')
    //   .leftJoin('course.chapters', 'chapter')
    //   .leftJoin('course.createdBy', 'user')
    //   .where('course.createdById = :id', { id: userId })
    //   .orderBy('course.index', 'ASC')
    //   .select([
    //     'course.id as id',
    //     'course.title as title',
    //     'COUNT(chapter.id) as chapters',
    //     'user.firstName as first_name',
    //     'user.lastName as last_name',
    //     'course.createdAt as created_at',
    //     'course.updatedAt as updated_at',
    //   ])
    //   .groupBy('course.id')
    //   .addGroupBy('user.lastName')
    //   .addGroupBy('user.firstName')
    //   .getRawMany<{
    //     id: number;
    //     title: string;
    //     chapters: number;
    //     first_name: string;
    //     last_name: string;
    //     created_at: string;
    //     updated_at: string;
    //   }>();

    // const result = courses.map((course) => {
    //   return {
    //     id: course.id,
    //     title: course.title,
    //     chapters: `${course.chapters} capítulos`,
    //     createdBy: course.first_name + ' ' + course.last_name,
    //     createdAt: moment(course.created_at).format('DD/MM/yyyy HH:mm:ss'),
    //     updatedAt: moment(course.updated_at).format('DD/MM/yyyy HH:mm:ss'),
    //   };
    // });

    // return result;

    const courses = await this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.createdBy', 'createdBy')
      .leftJoinAndSelect('course.chapters', 'chapters')
      .where('course.deletedAt IS NULL AND course.createdById = :id', {
        id: userId,
      })
      .orderBy('course.index', 'ASC')
      .getMany();

    const result = courses.map((course) => ({
      id: course.id,
      title: course.title,
      createdBy: course.createdBy.firstName + ' ' + course.createdBy.lastName,
      chapters: `${course.chapters.length} capítulos`,
      code: course.code,
      urlLogo: course.urlLogo,
      index: course.index,
      isPublic: course.isPublic,
      createAt: DateTime.fromISO(course.createdAt.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
      updatedAt: DateTime.fromISO(course.updatedAt.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
    }));

    return result;
  }

  // Recupera los cursos que el usuario tiene suscritos
  // y el progreso de cada uno.
  async findMySubscriptionsCourses(userId: number) {
    const usuario = await this.userRepo.findOneOrFail({
      where: { id: userId },
      relations: ['subscriptions', 'subscriptions.course'],
    });

    const cursoConProgreso = usuario.subscriptions.map<CourseWithProgressDto>(
      (sub) => {
        return {
          id: sub.course.id,
          title: sub.course.title,
          code: sub.course.code,
          chapters: 0,
          index: sub.course.index,
          urlLogo: sub.course.urlLogo,
          progress: sub.progreso,
        };
      },
    );

    return cursoConProgreso;
  }

  async createCourse(userId: number, payload: CreateCourseDto) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }
    const course = plainToClass(Course, payload);

    course.createdBy = user;
    course.code = uuidv4().slice(0, 8);
    if (!course.urlLogo) {
      course.urlLogo = null;
    }
    course.index = await this.getLastPositionCourse();

    return await this.courseRepo.save(course);
  }

  async getLastPositionCourse(): Promise<number> {
    const lastCourse = await this.courseRepo.count();
    return lastCourse;
  }

  async updateCourse(
    userId: number,
    courseId: number,
    updateCourseDto: UpdateCourseDto,
  ) {
    const courses = await this.courseRepo.find({
      relations: {
        createdBy: true,
      },
      where: {
        id: courseId,
      },
      take: 1,
    });

    if (!courses) {
      throw new Error('Course not found');
    }

    const course = courses[0];

    if (course.createdBy.id !== userId) {
      throw new Error('Not authorized');
    }

    course.updatedAt = new Date();

    return await this.courseRepo.save({ ...course, ...updateCourseDto });
  }

  async deleteCourse(userId: number, courseId: number) {
    const courses = await this.courseRepo.find({
      relations: {
        createdBy: true,
      },
      where: {
        id: courseId,
      },
      take: 1,
    });

    if (!courses) {
      throw new Error('Course not found');
    }

    const course = courses[0];
    if (course.createdBy.id !== userId) {
      throw new Error('Not authorized');
    }

    course.deletedAt = new Date();

    return await this.courseRepo.save(course);
  }

  // Recupera todos los cursos, y el progreso de cada uno, en base al usuario.
  async findCourseWithProgress(userId: number, completed = false) {
    const query = this.courseRepo
      .createQueryBuilder('course')
      .where('course.isPublic = :isPublic', { isPublic: true })
      .leftJoinAndSelect(
        'course.subscriptions',
        'subscriptions',
        'subscriptions.userId = :userId',
        { userId },
      )
      .leftJoin('course.chapters', 'chapter')
      // .select([
      //   'course.id as id',
      //   'course.title as title',
      //   'course.urlLogo as url_logo',
      //   'course.code as code',
      //   'course.index as index',
      //   'subscriptions.progreso AS progreso',
      // ])
      .select([
        'course.id AS id',
        'course.title AS title',
        'course.urlLogo AS url_logo',
        'course.code AS code',
        'course.index AS index',
        'course.isPublic AS is_public',
        'CAST(COUNT(chapter.id) AS INTEGER) AS chapters',
        'subscriptions.progreso AS progreso',
      ])

      .groupBy('course.id, subscriptions.progreso')
      .orderBy('subscriptions.progreso', 'ASC');

    if (completed) {
      query.andWhere('subscriptions.progreso = :progreso', { progreso: 100 });
    } else {
      query
        .andWhere('subscriptions.progreso <> :progreso', { progreso: 100 })
        .orWhere('subscriptions.progreso IS NULL')
        .andWhere('course.isPublic = :isPublic', { isPublic: true });
    }

    console.log(query.getSql());

    // query.andWhere('course.isPublic = :isPublic', { isPublic: true });

    const courseWithProgress = await query.getRawMany<{
      id: number;
      title: string;
      url_logo: string;
      code: string;
      index: number;
      chapters: number;
      progreso: number;
      is_public: boolean;
    }>();

    // courseWithProgress = courseWithProgress.filter((c) => c.is_public === true);

    // const beforeStarting = false;
    const nextToStart = this.newNextToStart();
    const result = courseWithProgress.map<CourseWithProgressDto>((curso) => ({
      id: curso.id,
      title: curso.title,
      urlLogo: curso.url_logo,
      code: curso.code,
      chapters: curso.chapters,
      progress: curso.progreso != null ? curso.progreso : 0,
      started: curso.progreso != null,
      nextToStart: nextToStart(curso.progreso != null ? true : false),
      index: curso.index,
    }));

    // result.sort((a, b) => b.progress - a.progress);

    return result;
  }

  /**
   * Crea una función que devuelve si el capitulo es el siguiente a
   * iniciar basado en el progreso.
   *
   * @returns Una función que recibe el progreso de un curso y devuelve
   * si el capitulo es el siguiente a iniciar.
   */
  newNextToStart() {
    // Flag que mantiene el estado de si el usuario ya ha iniciado algun
    // curso o no.
    let beforeStarting = false;
    /**
     * Esta función recibe el progreso de un curso y devuelve si el capitulo
     * es el siguiente a iniciar. Si el usuario ya ha iniciado algun curso,
     * devuelve false, de lo contrario devuelve true y actualiza el flag
     * para evitar futuras invocaciones a devolver true.
     *
     * @param progreso El progreso de un curso.
     * @returns Si el capitulo es el siguiente a iniciar.
     */
    return function (progreso: boolean) {
      if (progreso || beforeStarting) {
        return false;
      }
      beforeStarting = true;
      return true;
    };
  }

  async findMyChapterWithProgress(userId: number, courseId: number) {
    const query = this.chapterRepo
      .createQueryBuilder('chapter')
      .leftJoin(
        'chapter.chapterProgressUsers',
        'progress',
        'progress.userId = :userId AND chapter.courseId = :courseId',
        { userId, courseId },
      )
      .where('chapter.courseId = :courseId AND chapter.deletedAt is null', {
        courseId,
      })
      .select([
        'chapter.id as id',
        'chapter.title as title',
        'chapter.shortDescription as short_description',
        'chapter.index as index',
        'progress.progress as progress',
      ])
      .orderBy('chapter.index', 'ASC');
    const data = await query.getRawMany();

    const nextToStart = this.newNextToStart();
    const result = data.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      shortDescription: chapter.short_description,
      progress: chapter.progress != null ? chapter.progress : 0,
      started: chapter.progress != null,
      // TODO: Revisar que nextToStart esta bien.
      nextToStart: nextToStart(chapter.progress === 100 ? true : false),
      index: chapter.index,
    }));

    return result;
  }
}
