import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import {
  ActivityDto,
  CreateActivityDto,
  UpdateActivityDto,
} from '../../../course/dtos/activity.dtos';
import { FeedbackExerciseDto } from '../../../course/dtos/exercises.dtos';
import { Activity } from '../../../database/entities/activity.entity';
import { ActivityProgressUser } from '../../../database/entities/activityProgress.entity';
import { ChapterProgressUser } from '../../../database/entities/chapterProgressUser.entity';
import { Course } from '../../../database/entities/course.entity';
import { Subscription } from '../../../database/entities/subscription.entity';
import { Tema } from '../../../database/entities/tema.entity';
import { User } from '../../../database/entities/user.entity';
import { In, IsNull, Repository } from 'typeorm';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity) private activityRepo: Repository<Activity>,
    @InjectRepository(Tema) private temaRepo: Repository<Tema>,
    @InjectRepository(ActivityProgressUser)
    private activityProgressUserRepo: Repository<ActivityProgressUser>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(ChapterProgressUser)
    private chapterProgressRepo: Repository<ChapterProgressUser>,
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
  ) {}

  async findActivityByID(id: number) {
    const activity = await this.activityRepo.findOneBy({
      id,
      deletedAt: IsNull(),
    });
    if (!activity) {
      throw new Error('not found activity');
    }

    return plainToClass(ActivityDto, activity, {
      excludeExtraneousValues: true,
    });
  }

  async findActivityByTemaID(temaId: number) {
    const activities = await this.activityRepo.findBy({
      tema: { id: temaId },
      deletedAt: IsNull(),
    });

    return activities.map((a) =>
      plainToClass(ActivityDto, a, { excludeExtraneousValues: true }),
    );
  }

  async createActivity(payload: CreateActivityDto) {
    const tema = await this.temaRepo.findOneBy({ id: payload.temaId });
    if (!tema) {
      throw new Error('no found tema');
    }

    const activity = plainToClass(Activity, payload);
    activity.tema = tema;
    const result = await this.activityRepo.save(activity);
    return plainToClass(ActivityDto, result, { excludeExtraneousValues: true });
  }

  async updateActivityById(id: number, payload: UpdateActivityDto) {
    const activity = await this.activityRepo.findOneBy({
      id,
      deletedAt: IsNull(),
    });
    if (!activity) {
      throw new Error('not found activity');
    }
    const tema = await this.temaRepo.findOneBy({ id: payload.temaId });
    if (!tema) {
      throw new Error('no found tema');
    }

    activity.tema = tema;

    const result = await this.activityRepo.save({ ...activity, ...payload });
    return plainToClass(ActivityDto, result, { excludeExtraneousValues: true });
  }

  async deleteActivityById(id: number) {
    const activity = await this.activityRepo.findOneBy({ id: id });
    if (!activity) {
      throw new Error('not found activity');
    }

    activity.deletedAt = new Date();

    const result = await this.activityRepo.save(activity);
    return plainToClass(ActivityDto, result, { excludeExtraneousValues: true });
  }

  // getActivityWithExercise recuperamos la actividad con los ejercicios asociados
  // para que un usuario pueda realizar la actividad.
  async getActivityWithExercise(activityId: number) {
    const activity = await this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.exercises', 'exercises')
      .where('activity.id = :id', { id: activityId })
      .orderBy('exercises.id', 'ASC')
      .getOne();

    if (!activity) {
      throw new Error('not found activity');
    }


    const data = {
      id: activity.id,
      title: activity.title,
      exercises: activity.exercises.map((e) => {
        return {
          id: e.id,
          statement: e.statement,
          code: e.code,
          typeExercise: e.typeExercise,
          approach:
            e.typeExercise === 'selection_single' ||
            e.typeExercise === 'selection_multiple'
              ? 'Teórica'
              : 'Practica',
          hind: e.hind,
          optionSelectOptions: e.optionSelectOptions.sort(this.aleatorio),
          optionOrderFragmentCode: e.optionOrderFragmentCode.sort(
            this.aleatorio,
          ),
          optionOrderLineCode: e.optionOrderLineCode.sort(this.aleatorio),
          optionFindErrorCode: e.optionsFindErrorCode.sort(this.aleatorio),
          optionsVerticalOrdering: (e.optionsVerticalOrdering || []).sort(this.aleatorio),
          optionsHorizontalOrdering: (e.optionsHorizontalOrdering || []).sort(this.aleatorio),
          optionsPhishingSelection: (e.optionsPhishingSelection || []).sort(this.aleatorio),
          phishingContext: e.phishingContext || '',
          phishingImageUrl: e.phishingImageUrl || '',
          optionsMatchPairsLeft: e.optionsMatchPairsLeft || [],
          optionsMatchPairsRight: (e.optionsMatchPairsRight || []).sort(this.aleatorio),
        };
      }),
    };

    return data;
  }

  aleatorio() {
    return Math.random() - 0.5;
  }

  async finishActivity(
    activityID: number,
    userId: number,
    payload: FeedbackExerciseDto[],
  ) {
    const score = payload.reduce(
      (sum, current) => sum + current.qualification,
      0,
    );
    // const average = score / payload.length;

    const precision = Math.round((score / (payload.length * 10)) * 100);

    const activity = await this.activityRepo.findOne({
      where: { id: activityID },
    });

    if (!activity) {
      throw new Error('not found activity');
    }

    let activityProgressUser = await this.activityProgressUserRepo.findOne({
      where: {
        activity: { id: activityID },
        user: { id: userId },
      },
      relations: ['activity', 'user'],
    });

    if (!activityProgressUser) {
      activityProgressUser = new ActivityProgressUser();
      activityProgressUser.user = await this.userRepo.findOneBy({
        id: userId,
      });
      activityProgressUser.activity = activity;
      activityProgressUser.progress = 100;
      activityProgressUser.score = score;
      activityProgressUser.accuracy = precision;
      // await this.activityProgressUserRepo.save(newActivityProgressUser);
    } else {
      // simplemente lo actualizamos con el progreso.
      activityProgressUser.progress = 100;
      activityProgressUser.score = score;
      activityProgressUser.accuracy = precision;
      // await this.activityProgressUserRepo.save(activityProgressUser);
    }

    const activityProgress =
      await this.activityProgressUserRepo.save(activityProgressUser);

    this.updateProgressChapter(activityID, userId);

    // Calculate the amount of gems based on the accuracy percentage
    let gems = 0;
    if (activityProgress.accuracy >= 75) {
      gems = 50;
    } else if (activityProgress.accuracy >= 50) {
      gems = 25;
    } else if (activityProgress.accuracy >= 25) {
      gems = 10;
    }

    this.userRepo.findOneBy({ id: userId }).then((user) => {
      user.yachay += gems;
      this.userRepo.save(user);
    });

    return {
      id: activityProgress.activity.id,
      progress: activityProgress.progress,
      score: activityProgress.score,
      accuracy: activityProgress.accuracy,
      activity: activityProgress.activity.title,
      gems: gems,
    };
  }

  async updateProgressChapter(activityId: number, userId: number) {
    const activity = await this.activityRepo.findOne({
      where: {
        id: activityId,
      },
      relations: ['tema.chapter.course'],
    });
    if (!activity) {
      throw new Error('not found activity');
    }

    // Recuperar todas las actividades del chapter.
    const activitiesByChapter = await this.activityRepo.find({
      where: {
        tema: { chapter: { id: activity.tema.chapter.id } },
      },
    });

    const progressActivitiesByChapter =
      await this.activityProgressUserRepo.find({
        where: {
          activity: { id: In(activitiesByChapter.map((a) => a.id)) },
          user: { id: userId },
        },
      });

    const progressChapter = Math.floor(
      (progressActivitiesByChapter.length / activitiesByChapter.length) * 100,
    );

    let chapterProgressUser = await this.chapterProgressRepo.findOne({
      where: {
        user: { id: userId },
        chapter: { id: activity.tema.chapter.id },
      },
    });

    // en caso de no existir el registro creamos una instancia.
    if (!chapterProgressUser) {
      chapterProgressUser = new ChapterProgressUser();
      chapterProgressUser.user = await this.userRepo.findOneBy({
        id: userId,
      });
    }

    chapterProgressUser.chapter = activity.tema.chapter;
    chapterProgressUser.progress = progressChapter;
    await this.chapterProgressRepo.save(chapterProgressUser);

    // Actualizar el progreso del curso.
    await this.updateCourseProgress(userId, activity.tema.chapter.course.id);
  }

  async updateCourseProgress(userId: number, courseId: number) {
    const activitiesByCourse = await this.activityRepo.find({
      where: {
        tema: { chapter: { course: { id: courseId } } },
      },
    });

    const progressActivitiesByCourse = await this.activityProgressUserRepo.find(
      {
        where: {
          activity: { id: In(activitiesByCourse.map((a) => a.id)) },
          user: { id: userId },
        },
      },
    );

    const progressCourse = Math.floor(
      (progressActivitiesByCourse.length / activitiesByCourse.length) * 100,
    );

    let subscriptionCourse = await this.subscriptionRepo.findOne({
      where: {
        user: { id: userId },
        course: { id: courseId },
      },
    });

    // si no existe la subscription la creamos.
    if (!subscriptionCourse) {
      subscriptionCourse = new Subscription();
      subscriptionCourse.user = await this.userRepo.findOneBy({
        id: userId,
      });
      subscriptionCourse.course = await this.courseRepo.findOneBy({
        id: courseId,
      });
    }

    subscriptionCourse.progreso = progressCourse;

    await this.subscriptionRepo.save(subscriptionCourse);
  }
}
