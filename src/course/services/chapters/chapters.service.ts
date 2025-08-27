import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import {
  CreateChapterDto,
  UpdateChapterDto,
} from '../../../course/dtos/chapters.dtos';
import { Chapter } from '../../../database/entities/chapter.entity';
import { ChapterProgressUser } from '../../../database/entities/chapterProgressUser.entity';
import { Course } from '../../../database/entities/course.entity';
import { User } from '../../../database/entities/user.entity';
import { IsNull, Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { formatDateFrontend } from '../../../common/constants';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(Chapter) private _chapterRepository: Repository<Chapter>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(ChapterProgressUser)
    private chapterProgressUserRepo: Repository<ChapterProgressUser>,
  ) {}

  async findChaptersByCourseId(id: number, difficulty: string) {
    // Creamos el query builder.
    const chaptersQuery = this._chapterRepository
      .createQueryBuilder('chapter')
      .where({
        course: { id: id },
        deletedAt: IsNull(),
      })
      .orderBy('chapter.index', 'ASC');

    // si tenemos la dificultad, filtramos por ella.
    if (difficulty) {
      chaptersQuery.andWhere('chapter.difficulty = :difficulty', {
        difficulty,
      });
    }

    const chapters = await chaptersQuery.getMany();

    const result = chapters.map((chapter) => {
      return {
        id: chapter.id,
        title: chapter.title,
        shortDescription: chapter.shortDescription,
        difficulty: chapter.difficulty,
        index: chapter.index,
        createdAt: DateTime.fromISO(chapter.createdAt.toISOString()).toFormat(
          formatDateFrontend,
        ),
        updatedAt: DateTime.fromISO(chapter.updatedAt.toISOString()).toFormat(
          formatDateFrontend,
        ),
      };
    });

    return result;
  }

  async findChapterById(id: number) {
    const chapter = await this._chapterRepository.findOne({
      where: { id },
      relations: ['course'],
    });
    if (!chapter) {
      throw new Error('Chapter not found');
    }
    return {
      id: chapter.id,
      title: chapter.title,
      shortDescription: chapter.shortDescription,
      difficulty: chapter.difficulty,
      index: chapter.index,
      courseId: chapter.course.id,
      createdAt: DateTime.fromISO(chapter.createdAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
      updatedAt: DateTime.fromISO(chapter.updatedAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
    };
  }

  async createCourse(payload: CreateChapterDto) {
    const course = await this.courseRepo.findOneBy({ id: payload.courseId });
    if (!course) {
      throw new Error('Course not found');
    }

    const chapter = plainToClass(Chapter, payload);
    chapter.course = course;

    chapter.index = await this.getLastPositionChapterByCourseId(course.id);

    return await this._chapterRepository.save(chapter);
  }

  async createMultipleChapters(courseId: number, payload: CreateChapterDto[]) {
    const course = await this.courseRepo.findOneBy({ id: courseId });
    if (!course) {
      throw new Error('Course not found');
    }

    let lastPosition = await this.getLastPositionChapterByCourseId(courseId);

    // Creamos las instancias de los capítulos.
    const chapters = payload.map((chapter) => {
      const newChapter = plainToClass(Chapter, chapter);
      newChapter.course = course;
      newChapter.index = lastPosition;
      lastPosition++;
      return newChapter;
    });

    const result = await this._chapterRepository.save(chapters);
    return result.map((chapter) => {
      return {
        id: chapter.id,
        title: chapter.title,
        shortDescription: chapter.shortDescription,
        difficulty: chapter.difficulty,
        index: chapter.index,
        createdAt: DateTime.fromISO(chapter.createdAt.toISOString()).toFormat(
          formatDateFrontend,
        ),
        updatedAt: DateTime.fromISO(chapter.updatedAt.toISOString()).toFormat(
          formatDateFrontend,
        ),
      };
    });
  }

  async initChapter(chapterId: number, userId: number) {
    // Verificar si existe.

    let chapterProgressUser = await this.chapterProgressUserRepo.findOneBy({
      chapter: { id: chapterId },
      user: { id: userId },
    });
    if (!chapterProgressUser) {
      chapterProgressUser = new ChapterProgressUser();
    }
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }
    const chapter = await this._chapterRepository.findOneBy({ id: chapterId });
    if (!chapter) {
      throw new Error('Chapter not found');
    }

    chapterProgressUser.user = user;
    chapterProgressUser.chapter = chapter;
    chapterProgressUser.progress = 0;

    await this.chapterProgressUserRepo.save(chapterProgressUser);
  }

  private async getLastPositionChapterByCourseId(courseId: number) {
    const position = await this._chapterRepository.count({
      where: { course: { id: courseId }, deletedAt: null },
    });

    return position;
  }

  async updateChapter(chapterId: number, payload: UpdateChapterDto) {
    const chapter = await this._chapterRepository.findOneBy({
      id: chapterId,
      deletedAt: IsNull(),
    });
    if (!chapter) {
      throw new Error('Chapter not found');
    }

    return await this._chapterRepository.save({ ...chapter, ...payload });
  }

  async deleteChapter(chapterId: number) {
    const chapter = await this._chapterRepository.findOneBy({
      id: chapterId,
      deletedAt: IsNull(),
    });
    if (!chapter) {
      throw new Error('Chapter not found');
    }

    // chapter.deletedAt = new Date();
    // return await this._chapterRepository.save(chapter);
    await this._chapterRepository.softDelete(chapterId);
    return chapter;
  }
}
