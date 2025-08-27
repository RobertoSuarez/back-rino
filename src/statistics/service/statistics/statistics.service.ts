import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActivityProgressUser } from '../../../database/entities/activityProgress.entity';
import { User } from '../../../database/entities/user.entity';
import { Repository } from 'typeorm';
import { Course } from 'src/database/entities/course.entity';
import { Classes } from 'src/database/entities/classes.entity';
import { Assessment } from 'src/database/entities/assessment.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(User)
    private _userRepository: Repository<User>,
    @InjectRepository(ActivityProgressUser)
    private _activityProgressUserRepository: Repository<ActivityProgressUser>,
    @InjectRepository(Course)
    private _courseRepository: Repository<Course>,
    @InjectRepository(Classes)
    private _classesRepository: Repository<Classes>,
    @InjectRepository(Assessment)
    private _assessmentRepository: Repository<Assessment>,
  ) {}

  async getTopUsers() {
    const result = await this._activityProgressUserRepository
      .createQueryBuilder('activityProgressUser')
      .select(
        'user.id as id, user.firstName as firstName, user.lastName as lastName, user.urlAvatar as urlAvatar  , ROUND(SUM(score)::numeric, 2)::int AS score',
      )
      .leftJoin('activityProgressUser.user', 'user')
      .groupBy('user.id')
      .orderBy('score', 'DESC')
      .limit(20)
      .getRawMany();
    return result.map((r) => ({
      id: r.id,
      firstName: r.firstname,
      lastName: r.lastname,
      url: r.urlavatar
        ? r.urlavatar
        : `https://ui-avatars.com/api/?name=${r.firstname?.split(' ')[0]}+${r.lastname?.split(' ')[0]}&background=1B802F&color=fff`,
      score: r.score,
    }));
  }

  async getCursosClasesEvaluaciones(userId: number) {
    const countCourses = await this._courseRepository.count({
      where: {
        createdBy: {
          id: userId,
        },
      },
    });

    const countClass = await this._classesRepository.count({
      where: {
        teacher: {
          id: userId,
        },
      },
    });

    const assessmentPending = await this._assessmentRepository
      .createQueryBuilder('assessment')
      .leftJoin('assessment.class', 'class')
      .where('class.teacherId = :userId ', {
        userId,
      })
      .andWhere('now() < assessment.finished')
      .getCount();

    return {
      countCourses,
      countClass,
      assessmentPending,
    };
  }

  async getScoreByUser(userId: number): Promise<number> {
    const result = await this._activityProgressUserRepository
      .createQueryBuilder('activityProgressUser')
      .select('ROUND(SUM(score)::numeric, 2)::float AS score')
      .where('activityProgressUser.userId = :userId', { userId })
      .groupBy('activityProgressUser.userId')
      .getRawOne();
    return result ? parseInt(result['score']) : 0;
  }
}
