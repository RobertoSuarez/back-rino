import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import {
  CheckExerciseDto,
  CreateExercise,
  ExerciseDto,
  FeedbackExerciseDto,
  UpdateExercise,
} from '../../../course/dtos/exercises.dtos';
import { Activity } from '../../../database/entities/activity.entity';
import { Exercise } from '../../../database/entities/exercise.entity';
import { Repository } from 'typeorm';
import { ChatCompletionService } from '../../../openai/services/chat-completation/chat-completation.service';
import { DateTime } from 'luxon';
import { formatDateFrontend } from '../../../common/constants';

@Injectable()
export class ExercisesService {
  constructor(
    @InjectRepository(Exercise) private exerciseRepo: Repository<Exercise>,
    @InjectRepository(Activity) private activityRepo: Repository<Activity>,
    private chatCompletionService: ChatCompletionService,
  ) {}

  frasesPositivas: string[] = [
    '¡Muchísimas felicidades!',
    'Estás haciendo un gran trabajo',
    'Continúa así, eres una verdadera superstar',
    'Eres una inspiración',
    'Tu dedicación y esfuerzo te están llevando a lo alto',
    'Sigue asi, te estamos viendo subir',
    'Eres un ejemplo a seguir',
    'Te estamos apoyando en este camino',
    'Eres una pionera/o, seguimos adelante',
    'Sigamos adelante, has tenido una buena respuesta',
    'Excelente, sigue asi',
    '¡Muy bien hecho!',
    'Eres genial, muchas gracias por tu dedicación',
  ];

  async getExercises(temaId: number, activity: string) {
    const exercisesQuery = this.exerciseRepo
      .createQueryBuilder('exercise')
      .innerJoinAndSelect('exercise.activity', 'activity')
      .innerJoin('activity.tema', 'tema', 'tema.id = :temaId', {
        temaId: temaId,
      })
      .orderBy('exercise.id', 'ASC');

    if (activity) {
      let value = activity;
      switch (activity) {
        case 'actividad1':
          value = 'Actividad 1';
          break;
        case 'actividad2':
          value = 'Actividad 2';
          break;
        case 'actividad3':
          value = 'Actividad 3';
          break;
      }
      exercisesQuery.andWhere('activity.title = :activity', {
        activity: value,
      });
    }

    const exercises = await exercisesQuery.getMany();

    const result = exercises.map((e) => {
      return {
        id: e.id,
        typeExercise: e.typeExercise,
        statement: e.statement,
        title: e.activity.title,
        approach:
          e.typeExercise === 'selection_single' ||
          e.typeExercise === 'selection_multiple'
            ? 'Teoría'
            : 'Práctica',
        createdAt: DateTime.fromISO(e.createdAt.toISOString())
          .setZone('America/Guayaquil')
          .toFormat(formatDateFrontend),
        updatedAt: DateTime.fromISO(e.updatedAt.toISOString())
          .setZone('America/Guayaquil')
          .toFormat(formatDateFrontend),
      };
    });
    return result;
  }

  async getExercisesPractice(chapterId: number) {
    console.log(chapterId);
    const exercises = await this.exerciseRepo
      .createQueryBuilder('exercise')
      .leftJoinAndSelect('exercise.activity', 'activity')
      .leftJoinAndSelect('activity.tema', 'tema')
      .leftJoinAndSelect('tema.chapter', 'chapter')
      .where('chapter.id = :chapterId', { chapterId: chapterId })
      .orderBy('RANDOM()')
      .limit(15)
      .getMany();

    return exercises.map((e) => {
      return {
        id: e.id,
        statement: e.statement,
        code: e.code,
        typeExercise: e.typeExercise,
        approach:
          e.typeExercise === 'selection_single' ||
          e.typeExercise === 'selection_multiple'
            ? 'Teórica'
            : 'Practica',
        hind: e.hind,
        optionSelectOptions: e.optionSelectOptions.sort(this.aleatorio),
        optionOrderFragmentCode: e.optionOrderFragmentCode.sort(this.aleatorio),
        optionOrderLineCode: e.optionOrderLineCode.sort(this.aleatorio),
        optionFindErrorCode: e.optionsFindErrorCode.sort(this.aleatorio),
      };
    });
  }

  aleatorio() {
    return Math.random() - 0.5;
  }

  async getExerciseById(id: number) {
    const exercise = await this.exerciseRepo
      .createQueryBuilder('exercise')
      .leftJoinAndSelect('exercise.activity', 'activity')
      .where('exercise.id = :id', { id: id })
      .getOne();
    if (!exercise) {
      throw new Error('Exercise not found');
    }
    return {
      id: exercise.id,
      activityId: exercise.activity.id,
      statement: exercise.statement,
      code: exercise.code,
      hind: exercise.hind,
      typeExercise: exercise.typeExercise,
      difficulty: exercise.difficulty,
      optionSelectionOptions: exercise.optionSelectOptions,
      optionOrderFragmentCode: exercise.optionOrderFragmentCode,
      optionOrderLineCode: exercise.optionOrderLineCode,
      optionsFindErrorCode: exercise.optionsFindErrorCode,
      answerSelectCorrect: exercise.answerSelectCorrect,
      answerSelectsCorrect: exercise.answerSelectsCorrect,
      answerOrderFragmentCode: exercise.answerOrderFragmentCode,
      answerOrderLineCode: exercise.answerOrderLineCode,
      answerFindError: exercise.answerFindError,

      // title: exercise.activity.title,
      // approach:
      //   exercise.typeExercise === 'selection_single' ||
      //   exercise.typeExercise === 'selection_multiple'
      //     ? 'Teoría'
      //     : 'Práctica',
      // createdAt: DateTime.fromISO(exercise.createdAt.toISOString())
      //   .setZone('America/Guayaquil')
      //   .toFormat(formatDateFrontend),
      // updatedAt: DateTime.fromISO(exercise.updatedAt.toISOString())
      //   .setZone('America/Guayaquil')
      //   .toFormat(formatDateFrontend),
    };
  }

  async deleteExerciseById(id: number) {
    const exercise = await this.exerciseRepo.findOneBy({ id: id });
    if (!exercise) {
      throw new Error('Exercise not found');
    }
    const result = await this.exerciseRepo.softDelete({ id: id });
    return {
      ok: result.affected > 0,
    };
  }

  async updateExercise(ExerciseId: number, payload: UpdateExercise) {
    const exercise = await this.exerciseRepo.findOneBy({
      id: ExerciseId,
    });

    if (!exercise) {
      throw new Error('Exercise not found');
    }

    const data = plainToClass(Exercise, payload);

    const result = await this.exerciseRepo.save({ ...exercise, ...data });
    return plainToClass(ExerciseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  async createExercise(payload: CreateExercise) {
    // Recuperamos la actividad.
    const activity = await this.activityRepo.findOneBy({
      id: payload.activityId,
    });

    if (!activity) {
      throw new Error('Activity not found');
    }

    // Creamos la instancia del ejercicio.
    const exercise = plainToClass(Exercise, payload);
    exercise.activity = activity;

    // const exercise = this.exerciseRepo.create({
    //   activity: activity,
    // });

    // Verificamos que las preguntas estén con las opciones correctas.
    switch (exercise.typeExercise) {
      case 'selection_single':
        if (exercise.optionSelectOptions.length < 1) {
          throw new Error('No options for selection_single');
        }

        // Verificamos que la opción correcta este en las opciones.
        if (
          !exercise.optionSelectOptions.includes(exercise.answerSelectCorrect)
        ) {
          throw new Error('Answer not in options for selection_single');
        }
        break;
      case 'selection_multiple':
        if (exercise.optionSelectOptions.length < 1) {
          throw new Error('No options for selection_multiple');
        }

        // Verificar que las respuestas correctas estén en las opciones.
        for (const answer of exercise.answerSelectsCorrect) {
          if (!exercise.optionSelectOptions.includes(answer)) {
            throw new Error('Answer not in options for selection_multiple');
          }
        }
        break;
      case 'order_fragment_code':
        // verificar que las opciones estén en la respuesta correcta.
        for (const answer of exercise.optionOrderFragmentCode) {
          if (!exercise.answerOrderFragmentCode.includes(answer)) {
            throw new Error('Answer not in options for order_fragment_code');
          }
        }

        break;
      case 'order_line_code':
        // verificar que las opciones estén en la respuesta correcta.
        for (const answer of exercise.answerOrderLineCode) {
          if (!exercise.optionOrderLineCode.includes(answer)) {
            throw new Error('Answer not in options for order_line_code');
          }
        }
        break;

      case 'write_code':
        // No se verifica nada, ya que la AI realizara el análisis de la respuesta.
        break;

      case 'find_error_code':
        // Verificar que entre las opciones de error estén las respuestas correctas.
        if (!exercise.optionsFindErrorCode.includes(exercise.answerFindError)) {
          throw new Error('Answer not in options for find_error_code');
        }
        break;
    }

    const result = await this.exerciseRepo.save(exercise);

    return { id: result.id };
  }

  async checkAnswer(
    exerciseId: number,
    answer: CheckExerciseDto,
  ): Promise<FeedbackExerciseDto> {
    const exercise = await this.exerciseRepo.findOneBy({
      id: exerciseId,
    });

    if (!exercise) {
      throw new Error('Exercise not found');
    }
    let result: FeedbackExerciseDto = {
      qualification: 0,
      feedback: '',
    };

    switch (exercise.typeExercise) {
      case 'selection_single':
        result =
          await this.chatCompletionService.getFeedbackExerciseSelectionSingle(
            answer.answerSelect,
            exercise.answerSelectCorrect,
            exercise.statement,
          );
        if (answer.answerSelect === exercise.answerSelectCorrect) {
          result.qualification = 10;
          // result.feedback =
          //   this.frasesPositivas[
          //     Math.floor(Math.random() * this.frasesPositivas.length)
          //   ];
        } else {
          result.qualification = 0;
        }
        break;
      case 'selection_multiple':
        // necesito obtener el numero de respuestas correctas.
        const correctAnswersUser = exercise.answerSelectsCorrect.filter(
          (answerCorrect) => answer.answerSelects.includes(answerCorrect),
        );

        const incorrectAnswerUser = answer.answerSelects.filter(
          (answerUser) => !exercise.answerSelectsCorrect.includes(answerUser),
        );

        const countAnswerCorrect = correctAnswersUser.length;
        const countAnswerIncorrect = incorrectAnswerUser.length;

        result.qualification =
          (10 / Number(exercise.answerSelectsCorrect.length)) *
            Number(countAnswerCorrect) -
          Number(countAnswerIncorrect);

        if (result.qualification < 0) {
          result.qualification = 0;
        }

        result.qualification = Math.round(result.qualification * 100) / 100;

        const { feedback } =
          await this.chatCompletionService.getFeedbackExerciseSelectionMultiple(
            exercise.statement,
            exercise.answerSelectsCorrect,
            answer.answerSelects,
          );

        result.feedback = feedback;

        if (result.qualification > 7) {
          // result.feedback =
          //   this.frasesPositivas[
          //     Math.floor(Math.random() * this.frasesPositivas.length)
          //   ];
        } else {
          // result.qualification = 0;
          // result.feedback = 'No has podido seleccionar ninguna opción correcta';
        }

        break;

      case 'order_fragment_code':
        result =
          await this.chatCompletionService.getFeedbackExerciseOrdenFragmentCode(
            exercise.statement,
            exercise.answerOrderFragmentCode,
            answer.answerOrderFragmentCode,
          );
        if (
          JSON.stringify(answer.answerOrderFragmentCode) ===
          JSON.stringify(exercise.answerOrderFragmentCode)
        ) {
          result.qualification = 10;
          // result.feedback =
          //   this.frasesPositivas[
          //     Math.floor(Math.random() * this.frasesPositivas.length)
          //   ];
        } else {
          // result.qualification = 0;
          // result.feedback = 'No es la respuesta correcta';
        }
        break;

      case 'order_line_code':
        result =
          await this.chatCompletionService.getFeedbackExerciseOrderLineCode(
            exercise.statement,
            exercise.answerOrderLineCode,
            answer.answerOrderLineCode,
          );
        if (
          JSON.stringify(answer.answerOrderLineCode) ===
          JSON.stringify(exercise.answerOrderLineCode)
        ) {
          result.qualification = 10;
          // result.feedback =
          //   this.frasesPositivas[
          //     Math.floor(Math.random() * this.frasesPositivas.length)
          //   ];
        } else {
          // result.qualification = 0;
          // result.feedback = 'No es la respuesta correcta';
        }
        break;

      case 'write_code':
        result = await this.chatCompletionService.getFeedbackExerciseWriteCode(
          exercise.statement,
          answer.answerWriteCode,
        );

        break;
      case 'find_error_code':
        const { feedback: f } =
          await this.chatCompletionService.getFeedbackExerciseFindError(
            exercise.statement,
            exercise.answerFindError,
            answer.answerFindError,
          );
        result.feedback = f;
        if (answer.answerFindError === exercise.answerFindError) {
          result.qualification = 10;
          // result.feedback =
          //   this.frasesPositivas[
          //     Math.floor(Math.random() * this.frasesPositivas.length)
          //   ];
        } else {
          result.qualification = 0;
        }
        break;
    }

    return result;
  }
}
