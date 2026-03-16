import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Course } from '../../../database/entities/course.entity';
import { Chapter } from '../../../database/entities/chapter.entity';
import { Tema } from '../../../database/entities/tema.entity';
import { Activity } from '../../../database/entities/activity.entity';
import { Exercise } from '../../../database/entities/exercise.entity';
import { User } from '../../../database/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BulkCourseService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async createFullCourse(userId: number, data: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.userRepo.findOneBy({ id: userId });
      if (!user) throw new Error('User not found');

      // 1. Crear el Curso
      const course = new Course();
      course.title = data.courseTitle;
      course.description = data.description;
      course.createdBy = user;
      course.code = uuidv4().slice(0, 8);
      course.isPublic = data.isPublic || false;
      course.isDraft = data.isDraft !== undefined ? data.isDraft : true;
      course.urlLogo = data.urlLogo || null;
      
      const lastCourseCount = await queryRunner.manager.count(Course);
      course.index = lastCourseCount;

      const savedCourse = await queryRunner.manager.save(course);

      // 2. Crear Capítulos
      if (data.chapters && data.chapters.length > 0) {
        for (let i = 0; i < data.chapters.length; i++) {
          const chapData = data.chapters[i];
          const chapter = new Chapter();
          chapter.title = chapData.title;
          chapter.shortDescription = chapData.description;
          chapter.course = savedCourse;
          chapter.index = i;
          
          const savedChapter = await queryRunner.manager.save(chapter);

          // 3. Crear Temas
          if (chapData.temas && chapData.temas.length > 0) {
            for (let j = 0; j < chapData.temas.length; j++) {
              const temaData = chapData.temas[j];
              const tema = new Tema();
              tema.title = temaData.title;
              tema.shortDescription = temaData.shortDescription;
              tema.theory = temaData.theory || `<p>Contenido sugerido para ${temaData.title}</p>`;
              tema.chapter = savedChapter;
              tema.index = j;

              const savedTema = await queryRunner.manager.save(tema);

                  // 4. Crear Actividades
                  if (chapData.temas[j].activities && chapData.temas[j].activities.length > 0) {
                    for (let k = 0; k < chapData.temas[j].activities.length; k++) {
                      let actData = chapData.temas[j].activities[k];
                      
                      // Safeguard: AI sometimes returns a string for the activity
                      if (typeof actData === 'string') {
                        actData = { title: actData, exercises: [] };
                      }

                      const activity = new Activity();
                      activity.title = actData.title || `Actividad ${k+1}`;
                      activity.index = k;
                      activity.tema = savedTema;
                      
                      const savedActivity = await queryRunner.manager.save(activity);
                      
                      // 5. Crear Ejercicios
                      if (actData.exercises && actData.exercises.length > 0) {
                        for (let l = 0; l < actData.exercises.length; l++) {
                          let exData = actData.exercises[l];
                          
                          // Safeguard: Exercise as string
                          if (typeof exData === 'string') {
                            exData = { statement: exData, typeExercise: 'selection_single' };
                          }

                          const exercise = new Exercise();
                          exercise.statement = exData.statement || `Completa el ejercicio ${l+1}`;
                          exercise.typeExercise = exData.typeExercise || 'selection_single';
                          exercise.difficulty = exData.difficulty || 'Fácil';
                          exercise.hind = exData.hind || 'Analiza bien el mensaje';
                      
                      // Mapeo simple de opciones/respuestas según tipo
                      if (exercise.typeExercise === 'selection_single') {
                        exercise.optionSelectOptions = exData.optionSelectOptions || [];
                        exercise.answerSelectCorrect = exData.answerSelectCorrect || '';
                      } else if (exercise.typeExercise === 'selection_multiple') {
                        exercise.optionSelectOptions = exData.optionSelectOptions || [];
                        exercise.answerSelectsCorrect = exData.answerSelectsCorrect || [];
                      } else if (exercise.typeExercise === 'match_pairs') {
                        exercise.optionsMatchPairsLeft = exData.optionsMatchPairsLeft || [];
                        exercise.optionsMatchPairsRight = exData.optionsMatchPairsRight || [];
                        exercise.answerMatchPairs = exData.answerMatchPairs || [];
                      }
                      
                      exercise.activity = savedActivity;
                      await queryRunner.manager.save(exercise);
                    }
                  }
                }
              }
            }
          }
        }
      }

      await queryRunner.commitTransaction();
      return savedCourse;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
