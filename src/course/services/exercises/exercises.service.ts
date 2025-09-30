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
import { GeminiService } from '../../../openai/services/gemini/gemini.service';
import { DateTime } from 'luxon';
import { formatDateFrontend } from '../../../common/constants';

@Injectable()
export class ExercisesService {
  constructor(
    @InjectRepository(Exercise) private exerciseRepo: Repository<Exercise>,
    @InjectRepository(Activity) private activityRepo: Repository<Activity>,
    private geminiService: GeminiService,
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

  async getExercises(activityId: number) {
    const exercises = await this.exerciseRepo.find({
      where: {
        activity: {
          id: activityId,
        },
      },
      relations: {
        activity: true,
      },
    });

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
      answerWriteCode: exercise.answerWriteCode,
      // Nuevos campos para los 4 tipos adicionales
      optionsVerticalOrdering: exercise.optionsVerticalOrdering,
      answerVerticalOrdering: exercise.answerVerticalOrdering,
      optionsHorizontalOrdering: exercise.optionsHorizontalOrdering,
      answerHorizontalOrdering: exercise.answerHorizontalOrdering,
      optionsPhishingSelection: exercise.optionsPhishingSelection,
      answerPhishingSelection: exercise.answerPhishingSelection,
      phishingContext: exercise.phishingContext,
      phishingImageUrl: exercise.phishingImageUrl,
      optionsMatchPairsLeft: exercise.optionsMatchPairsLeft,
      optionsMatchPairsRight: exercise.optionsMatchPairsRight,
      answerMatchPairs: exercise.answerMatchPairs,

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

      case 'vertical_ordering':
        if (!exercise.optionsVerticalOrdering || exercise.optionsVerticalOrdering.length < 2) {
          throw new Error('vertical_ordering requires at least 2 options');
        }
        if (!exercise.answerVerticalOrdering || exercise.answerVerticalOrdering.length !== exercise.optionsVerticalOrdering.length) {
          throw new Error('Answer must contain all options in correct order for vertical_ordering');
        }
        break;

      case 'horizontal_ordering':
        if (!exercise.optionsHorizontalOrdering || exercise.optionsHorizontalOrdering.length < 2) {
          throw new Error('horizontal_ordering requires at least 2 options');
        }
        if (!exercise.answerHorizontalOrdering || exercise.answerHorizontalOrdering.length !== exercise.optionsHorizontalOrdering.length) {
          throw new Error('Answer must contain all options in correct order for horizontal_ordering');
        }
        break;

      case 'phishing_selection_multiple':
        if (!exercise.optionsPhishingSelection || exercise.optionsPhishingSelection.length < 2) {
          throw new Error('phishing_selection_multiple requires at least 2 options');
        }
        if (!exercise.answerPhishingSelection || exercise.answerPhishingSelection.length < 1) {
          throw new Error('phishing_selection_multiple requires at least 1 correct answer');
        }
        // Verificar que las respuestas correctas estén en las opciones
        for (const answer of exercise.answerPhishingSelection) {
          if (!exercise.optionsPhishingSelection.includes(answer)) {
            throw new Error('Answer not in options for phishing_selection_multiple');
          }
        }
        break;

      case 'match_pairs':
        if (!exercise.optionsMatchPairsLeft || exercise.optionsMatchPairsLeft.length < 2) {
          throw new Error('match_pairs requires at least 2 left options');
        }
        if (!exercise.optionsMatchPairsRight || exercise.optionsMatchPairsRight.length < 2) {
          throw new Error('match_pairs requires at least 2 right options');
        }
        if (!exercise.answerMatchPairs || exercise.answerMatchPairs.length < 2) {
          throw new Error('match_pairs requires at least 2 correct pairs');
        }
        // Verificar que todos los pares tengan elementos válidos
        for (const pair of exercise.answerMatchPairs) {
          if (!exercise.optionsMatchPairsLeft.includes(pair.left)) {
            throw new Error('Left option in answer not found in optionsMatchPairsLeft');
          }
          if (!exercise.optionsMatchPairsRight.includes(pair.right)) {
            throw new Error('Right option in answer not found in optionsMatchPairsRight');
          }
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
          await this.geminiService.getFeedbackExerciseSelectionSingle(
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
          await this.geminiService.getFeedbackExerciseSelectionMultiple(
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
          await this.geminiService.getFeedbackExerciseOrdenFragmentCode(
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
          await this.geminiService.getFeedbackExerciseOrderLineCode(
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
        result = await this.geminiService.getFeedbackExerciseWriteCode(
          exercise.statement,
          answer.answerWriteCode,
        );

        break;
      case 'find_error_code':
        const { feedback: f } =
          await this.geminiService.getFeedbackExerciseFindError(
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
