import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import {
  CreateTemaDto,
  TemaDto,
  TemaForTeacherDto,
  UpdateTemaDto,
} from '../../../course/dtos/tema.dtos';
import { Chapter } from '../../../database/entities/chapter.entity';
import { Tema } from '../../../database/entities/tema.entity';
import { IsNull, Repository } from 'typeorm';
import { ActivityService } from '../activity/activity.service';
import { DateTime } from 'luxon';
import { formatDateFrontend } from '../../../common/constants';

@Injectable()
export class TemaService {
  constructor(
    @InjectRepository(Tema) private temaRepo: Repository<Tema>,
    @InjectRepository(Chapter) private chapterRepo: Repository<Chapter>,
    private activityService: ActivityService,
  ) {}

  async findTemasWithActivityByIdChapterId(userId: number, chapterId: number) {
    const result = await this.temaRepo
      .createQueryBuilder('tema')
      .leftJoinAndSelect('tema.activities', 'activity')
      .leftJoinAndSelect(
        'activity.activityProgressUsers',
        'progress',
        'progress.user = :userId',
        { userId: userId },
      )
      .where('tema.chapter.id = :chapterId', { chapterId: chapterId })
      .orderBy('tema.index', 'ASC')
      .getMany();

    const temas = result.map((tema) => {
      const t = {
        id: tema.id,
        title: tema.title,
        shortDescription: tema.shortDescription,
        urlBackground: tema.urlBackground,
        index: tema.index,
        completedActivities: 0,
        activitiesToComplete: 0,
        nextToStart: false,
      };
      const temaActivities = tema.activities.map((a) => {
        const progress =
          a.activityProgressUsers.length > 0
            ? a.activityProgressUsers[0].progress
            : 0;
        const completed = progress === 100;
        const activity = {
          id: a.id,
          title: a.title,
          started: a.activityProgressUsers.length > 0 ? true : false,
          progress: progress,
          completed: completed,
        };
        return activity;
      });

      // Ordenando las actividades por nombre
      temaActivities.sort((a, b) => a.title.localeCompare(b.title));

      // Contando las actividades completadas y no completadas
      t.completedActivities = temaActivities.filter((a) => a.completed).length;
      t.activitiesToComplete = temaActivities.filter(
        (a) => !a.completed,
      ).length;

      return { ...t, activities: temaActivities };
    });

    let prevCompleted = false;
    let beforeStarting = false;
    temas.forEach((tema, index) => {
      // En caso de estar en la primero posición se hace estas validaciones.
      // si la actividad no esta completa se establece, el nextToStart en verdadero.
      // si las actividades completadas mas las actvidades por completar es igual a las actividades
      // completa, eso quiere decir que la actividad se ha completado.
      if (
        index === 0 &&
        !(tema.activities.length === tema.completedActivities)
      ) {
        tema.nextToStart = true;
        beforeStarting = true;
        return;
      }

      // verificamos si ya se ha completado
      if (
        tema.activities.length === tema.completedActivities
        // tema.completedActivities + tema.activitiesToComplete ===
        // tema.completedActivities
      ) {
        prevCompleted = true;
        return;
      }

      if (beforeStarting) {
        tema.nextToStart = false;
        return;
      }
      if (prevCompleted) {
        tema.nextToStart = true;
        beforeStarting = true;
        return;
      }
    });

    return temas;
  }

  async findTheoryByTemaId(temaId: number): Promise<string> {
    const tema = await this.temaRepo.findOneBy({ id: temaId });
    return tema.theory;
  }

  async findTemasWithProgressByChapterId(userId: number, chapterId: number) {
    const query = this.temaRepo
      .createQueryBuilder('temas')
      .leftJoin(
        'temas.temaProgressUsers',
        'progress',
        'progress.userId = :userId',
        { userId },
      )
      .where('temas.chapterId = :chapterId', { chapterId })
      .select([
        'temas.id as id',
        'temas.title as title',
        'temas.shortDescription as short_description',
        'temas.urlBackground as url_background',
        'temas.index as index',
        'progress.progress as progress',
      ])
      .orderBy('temas.index', 'ASC');

    const data = await query.getRawMany();

    const result = data.map((tema) => ({
      id: tema.id,
      title: tema.title,
      shortDescription: tema.short_description,
      urlBackground: tema.url_background,
      progress: tema.progress != null ? tema.progress : 0,
      started: tema.progress != null,
      index: tema.index,
    }));

    return result;
  }

  async findTemaById(temaId: number) {
    const tema = await this.temaRepo.findOneBy({ id: temaId });
    if (!tema) {
      throw new Error('Tema not found');
    }

    return {
      id: tema.id,
      title: tema.title,
      shortDescription: tema.shortDescription,
      theory: tema.theory,
      urlBackground: tema.urlBackground,
      index: tema.index,
      difficulty: tema.difficulty,
      createdAt: DateTime.fromISO(tema.createdAt.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
      updatedAt: DateTime.fromISO(tema.updatedAt.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
    };

    return plainToClass(TemaDto, tema, { excludeExtraneousValues: true });
  }

  async findByChapterId(chapterId: number) {
    const data = await this.temaRepo.find({
      where: { chapter: { id: chapterId }, deletedAt: IsNull() },
      order: { index: 'ASC' },
    });

    const result = data.map<TemaForTeacherDto>((tema) => ({
      id: tema.id,
      title: tema.title,
      difficulty: tema.difficulty,
      createdAt: DateTime.fromISO(tema.createdAt.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
      updatedAt: DateTime.fromISO(tema.updatedAt.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
    }));

    return result;
  }

  async createTema(payload: CreateTemaDto) {
    const tema = plainToClass(Tema, payload);
    const chapter = await this.chapterRepo.findOneBy({ id: payload.chapterId });
    if (!chapter) {
      throw new Error('Chapter not found');
    }
    tema.chapter = chapter;
    tema.index = await this.getLastPositionByChapterId(payload.chapterId);

    const temaSave = await this.temaRepo.save(tema);
    for (let i = 0; i < 3; i++) {
      this.activityService.createActivity({
        temaId: temaSave.id,
        title: `Actividad ${i + 1}`,
      });
    }

    return temaSave;
  }

  async registerMultipleTema(payload: CreateTemaDto[], chapterId: number) {
    const chapter = await this.chapterRepo.findOneBy({ id: chapterId });
    if (!chapter) {
      throw new Error('El capitulo no existe');
    }

    // registramos el chapter id.
    payload.forEach(async (t, index) => {
      payload[index].chapterId = chapterId;
      await this.createTema(t);
    });
  }

  async getLastPositionByChapterId(chapterId: number) {
    const result = await this.temaRepo.countBy({ chapter: { id: chapterId } });
    return result;
  }

  async updateTema(id: number, payload: UpdateTemaDto) {
    const tema = await this.temaRepo.findOneBy({ id, deletedAt: IsNull() });
    if (!tema) {
      throw new Error('Tema not found');
    }
    // Revisamos que el capitulo exista.
    const chapter = await this.chapterRepo.findOneBy({ id: payload.chapterId });
    if (!chapter) {
      throw new Error('Chapter not found');
    }
    tema.chapter = chapter;
    tema.updatedAt = new Date();
    return await this.temaRepo.save({ ...tema, ...payload });
  }

  async deleteTema(temaId: number) {
    const tema = await this.temaRepo.findOneBy({
      id: temaId,
    });
    if (!tema) {
      throw new Error('Tema not found');
    }
    return await this.temaRepo.softRemove(tema);
  }
}
