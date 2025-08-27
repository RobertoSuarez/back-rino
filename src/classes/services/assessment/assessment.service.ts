import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import {
  CreateAssessmentDto,
  UpdateAssessmentDto,
} from '../../../classes/dtos/assessment.dtos';
import { ResponseUserQuestionDto } from '../../../classes/dtos/question.dtos';
import { formatDateFrontend } from '../../../common/constants';
import { Assessment } from '../../../database/entities/assessment.entity';
import { AssessmentOfUser } from '../../../database/entities/assessmentOfUser.entity';
import { Classes } from '../../../database/entities/classes.entity';
import { QuestionOfUser } from '../../../database/entities/questionOfUser.entity';
import { User } from '../../../database/entities/user.entity';
import {
  EntityManager,
  In,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { QuestionOfAssessment } from 'src/database/entities/questionOfAssessment.entity';
import { ChatCompletionService } from 'src/openai/services/chat-completation/chat-completation.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class AssessmentService {
  constructor(
    @InjectRepository(Classes) private _classesRepository: Repository<Classes>,
    @InjectRepository(Assessment)
    private _assessmentRepository: Repository<Assessment>,
    @InjectRepository(AssessmentOfUser)
    private _assessmentOfUserRepository: Repository<AssessmentOfUser>,
    @InjectRepository(User)
    private _user: Repository<User>,
    @InjectRepository(QuestionOfUser)
    private _questionOfUserRepository: Repository<QuestionOfUser>,
    @InjectEntityManager()
    private _entityManager: EntityManager,
    private _chatCompletionService: ChatCompletionService,
  ) {}

  async createAssessment(payload: CreateAssessmentDto) {
    const classInstance = await this._classesRepository.findOneBy({
      id: payload.classId,
    });
    if (!classInstance) {
      throw new Error('Clase no encontrada');
    }

    const assessment = new Assessment();
    assessment.class = classInstance;
    assessment.title = payload.title;
    assessment.timeLimit = payload.timeLimit;
    assessment.started = DateTime.fromFormat(
      payload.started,
      formatDateFrontend,
      { zone: 'America/Guayaquil' },
    ).toJSDate();
    assessment.finished = DateTime.fromFormat(
      payload.finished,
      formatDateFrontend,
      { zone: 'America/Guayaquil' },
    ).toJSDate();
    assessment.contentFocus = payload.contentFocus;
    assessment.typeAssessment = payload.typeAssessment;
    assessment.amountOfAttempt = payload.amountOfAttempt;
    assessment.numberOfQuestions = payload.numberOfQuestions;
    if (assessment.typeAssessment === 'sumativa') {
      assessment.amountOfAttempt = 1;
    }
    const result = await this._assessmentRepository.save(assessment);

    return {
      id: result.id,
      title: result.title,
      timeLimit: result.timeLimit,
      started: DateTime.fromISO(result.started.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
      finished: DateTime.fromISO(result.finished.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
      contentFocus: result.contentFocus,
      typeAssessment: result.typeAssessment,
      amountOfAttempt: result.amountOfAttempt,
      numberOfQuestions: result.numberOfQuestions,
    };
  }

  async getAssessmentsByClassId(
    classId: number,
    status: 'in_progress' | 'finished' | 'all',
    userId: number,
  ) {
    console.log(userId);
    const now = new Date();
    const assessmentsQuery = this._assessmentRepository
      .createQueryBuilder('assessment')
      .leftJoinAndSelect('assessment.class', 'class')
      .andWhere('class.id = :classId', { classId })
      .orderBy('assessment.started', 'ASC');

    const assessmentUser = await this._assessmentOfUserRepository
      .createQueryBuilder('assessmentOfUser')
      .leftJoinAndSelect('assessmentOfUser.assessment', 'assessment')
      .leftJoinAndSelect('assessment.class', 'class')
      .where(
        'assessmentOfUser.studentId = :userId and assessment.class.id = :classId',
        { userId, classId },
      )
      .getMany();

    switch (status) {
      case 'in_progress':
        assessmentsQuery.andWhere({
          finished: MoreThanOrEqual(now),
        });

        assessmentsQuery.andWhere({
          id: Not(
            In(
              assessmentUser.map(
                (assessmentUser) => assessmentUser.assessment.id,
              ),
            ),
          ),
        });
        break;
      case 'finished':
        assessmentsQuery
          .andWhere({
            started: LessThanOrEqual(now),
            finished: LessThanOrEqual(now),
          })
          .orWhere({
            id: In(
              assessmentUser.map(
                (assessmentUser) => assessmentUser.assessment.id,
              ),
            ),
          });

        break;
      case 'all':
        break;
    }

    const assessments = await assessmentsQuery.getMany();
    return assessments.map((assessment) => ({
      id: assessment.id,
      title: assessment.title,
      timeLimit: assessment.timeLimit,
      status: assessment.finished < now ? 'CERRADA' : 'ABIERTA',
      started: DateTime.fromISO(assessment.started.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
      finished: DateTime.fromISO(assessment.finished.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
      contentFocus: assessment.contentFocus,
      typeAssessment: assessment.typeAssessment,
    }));
  }

  async getAssessmentById(id: number) {
    const assessment = await this._assessmentRepository.findOneBy({ id });
    if (!assessment) {
      throw new Error('Evaluación no encontrada');
    }
    return {
      id: assessment.id,
      title: assessment.title,
      timeLimit: assessment.timeLimit,
      started: DateTime.fromISO(assessment.started.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
      finished: DateTime.fromISO(assessment.finished.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
      contentFocus: assessment.contentFocus,
      typeAssessment: assessment.typeAssessment,
      amountOfAttempt: assessment.amountOfAttempt,
    };
  }

  async statusAssessment(assessmentId: number) {
    const assessment = await this._assessmentRepository.findOne({
      where: { id: assessmentId },
      relations: ['assessmentsOfUsers', 'assessmentsOfUsers.student'],
      order: { assessmentsOfUsers: { createdAt: 'DESC' } },
    });
    if (!assessment) {
      throw new Error('Evaluación no encontrada');
    }

    return {
      id: assessment.id,
      createdAt: DateTime.fromISO(assessment.createdAt.toISOString()).toFormat(
        formatDateFrontend,
      ),
      title: assessment.title,
      timeLimit: assessment.timeLimit,
      started:
        assessment.started &&
        DateTime.fromISO(assessment.started.toISOString())
          .setZone('America/Guayaquil')
          .toFormat(formatDateFrontend),
      finished:
        assessment.finished &&
        DateTime.fromISO(assessment.finished.toISOString())
          .setZone('America/Guayaquil')
          .toFormat(formatDateFrontend),
      contentFocus: assessment.contentFocus,
      typeAssessment: assessment.typeAssessment,
      amountOfAttempt: assessment.amountOfAttempt,
      students: assessment.assessmentsOfUsers.length,
      assessmentsOfUsers: assessment.assessmentsOfUsers.map((a) => ({
        id: a.id,
        started:
          a.started &&
          DateTime.fromISO(a.started.toISOString())
            .setZone('America/Guayaquil')
            .toFormat(formatDateFrontend),
        finished:
          a.finished &&
          DateTime.fromISO(a.finished.toISOString())
            .setZone('America/Guayaquil')
            .toFormat(formatDateFrontend),
        qualification: a.qualification,
        firstName: a.student.firstName,
        lastName: a.student.lastName,
      })),
    };
  }

  async getAssessmentsAttempted(assessmentId: number, userId: number) {
    console.log(assessmentId, userId);
    // información de la evaluación
    // los intentos mas calificación
    const assessment = await this._assessmentRepository.findOneBy({
      id: assessmentId,
    });

    if (!assessment) {
      throw new Error('Evaluación no encontrada');
    }

    const [assessmentsOfUser, countAssessments] =
      await this._assessmentOfUserRepository.findAndCount({
        where: { assessment: { id: assessmentId }, student: { id: userId } },
        relations: ['questionsOfUser'],
      });

    const intentos = assessmentsOfUser.map((a, index) => ({
      id: a.id,
      attempt: index + 1,
      started:
        a.started &&
        DateTime.fromISO(a.started.toISOString())
          .setZone('America/Guayaquil')
          .toFormat(formatDateFrontend),
      finished:
        a.finished &&
        DateTime.fromISO(a.finished.toISOString())
          .setZone('America/Guayaquil')
          .toFormat(formatDateFrontend),
      status: a.finished ? 'FINALIZADA' : 'NO FINALIZADA',
      qualification: a.qualification,
    }));

    // TODO: Aciertos. existe una pregunta que la debe calificar el profesor, por eso no se puede colocar este campo.

    return {
      id: assessment.id,
      title: assessment.title,
      timeLimit: assessment.timeLimit,
      started: DateTime.fromISO(assessment.started.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
      finished: DateTime.fromISO(assessment.finished.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
      status: assessment.finished < new Date() ? 'FINALIZADA' : 'ABIERTA',
      contentFocus: assessment.contentFocus,
      typeAssessment: assessment.typeAssessment,
      amountOfAttempt: assessment.amountOfAttempt,
      attemptsMade: countAssessments,
      attempts: intentos,
    };
  }

  async getAssessmentsOfUser(assessmentId: number) {
    const assessmentOfUser = await this._assessmentOfUserRepository.findOne({
      where: { id: assessmentId },
      relations: ['questionsOfUser'],
      order: { questionsOfUser: { id: 'ASC' } },
    });

    return {
      id: assessmentOfUser.id,
      started: DateTime.fromISO(assessmentOfUser.started.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
      finished: DateTime.fromISO(assessmentOfUser.finished?.toISOString()),
      questions: assessmentOfUser.questionsOfUser.map((q) => ({
        id: q.id,
        statement: q.statement,
        code: q.code,
        hind: q.hind,
        typeQuestion: q.typeQuestion,
        optionSelectOptions: q.optionSelectOptions,
        optionOrderFragmentCode: q.optionOrderFragmentCode,
        optionOrderLineCode: q.optionOrderLineCode,
        optionsFindErrorCode: q.optionsFindErrorCode,
        answerSelectCorrect: q.answerSelectCorrect,
        answerSelectsCorrect: q.answerSelectsCorrect,
        answerOrderFragmentCode: q.answerOrderFragmentCode,
        answerOrderLineCode: q.answerOrderLineCode,
        answerFindError: q.answerFindError,
      })),
    };
  }

  async getReviewAssessment(assessmentId: number) {
    const assessmentUser = await this._assessmentOfUserRepository.findOne({
      where: {
        id: assessmentId,
      },
      relations: {
        assessment: true,
        student: true,
        questionsOfUser: {
          questionOfAssessment: true,
        },
      },
    });

    if (!assessmentUser) {
      throw new Error('Evaluación no encontrada');
    }

    return {
      id: assessmentUser.id,
      student:
        assessmentUser.student.firstName +
        ' ' +
        assessmentUser.student.lastName,
      started: DateTime.fromISO(assessmentUser.started.toISOString()).toFormat(
        formatDateFrontend,
      ),
      finished: assessmentUser.finished
        ? DateTime.fromISO(assessmentUser.finished.toISOString()).toFormat(
            formatDateFrontend,
          )
        : null,
      qualification: assessmentUser.qualification
        ? parseFloat(assessmentUser.qualification.toFixed(2))
        : null,
      countQuestions: assessmentUser.questionsOfUser.length,
      questions: assessmentUser.questionsOfUser.map((q) => ({
        id: q.id,
        statement: q.statement,
        code: q.code,
        hind: q.hind,
        typeQuestion: q.typeQuestion,
        optionSelectOptions: q.optionSelectOptions,
        optionOrderFragmentCode: q.optionOrderFragmentCode,
        optionOrderLineCode: q.optionOrderLineCode,
        optionsFindErrorCode: q.optionsFindErrorCode,
        answerSelectCorrect: q.answerSelectCorrect,
        answerSelectsCorrect: q.answerSelectsCorrect,
        answerOrderFragmentCode: q.answerOrderFragmentCode,
        answerOrderLineCode: q.answerOrderLineCode,
        answerFindError: q.answerFindError,
        score: q.score / 10,
        answerCorrect: {
          code: q.questionOfAssessment.code,
          answerSelectCorrect: q.questionOfAssessment.answerSelectCorrect,
          answerSelectsCorrect: q.questionOfAssessment.answerSelectsCorrect,
          answerOrderFragmentCode:
            q.questionOfAssessment.answerOrderFragmentCode,
          answerOrderLineCode: q.questionOfAssessment.answerOrderLineCode,
          answerFindError: q.questionOfAssessment.answerFindError,
        },
      })),
    };
  }

  async updateAssessment(id: number, payload: UpdateAssessmentDto) {
    const assessment = await this._assessmentRepository.findOneBy({ id });
    if (!assessment) {
      throw new Error('Evaluación no encontrada');
    }
    assessment.title = payload.title;
    assessment.timeLimit = payload.timeLimit;
    assessment.started = DateTime.fromFormat(
      payload.started,
      formatDateFrontend,
      { zone: 'America/Guayaquil' },
    ).toJSDate();
    assessment.finished = DateTime.fromFormat(
      payload.finished,
      formatDateFrontend,
      { zone: 'America/Guayaquil' },
    ).toJSDate();
    assessment.contentFocus = payload.contentFocus;
    assessment.typeAssessment = payload.typeAssessment;
    assessment.amountOfAttempt = payload.amountOfAttempt;
    assessment.numberOfQuestions = payload.numberOfQuestions;
    const result = await this._assessmentRepository.save(assessment);
    return {
      id: result.id,
      title: result.title,
      timeLimit: result.timeLimit,
      started: DateTime.fromISO(result.started.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
      finished: DateTime.fromISO(result.finished.toISOString())
        .setZone('America/Guayaquil')
        .toFormat(formatDateFrontend),
      contentFocus: result.contentFocus,
      typeAssessment: result.typeAssessment,
      numberOfQuestions: result.numberOfQuestions,
    };
  }

  async responseQuestion(questionId: number, payload: ResponseUserQuestionDto) {
    const question = await this._questionOfUserRepository.findOne({
      where: { id: questionId },
      relations: ['questionOfAssessment'],
    });

    // Puntuamos la respuesta del usuario.
    question.score = await this.rateAnswer(
      payload,
      question.questionOfAssessment,
    );

    // question.answerUser = payload.answerUser;
    question.answerSelectCorrect = payload.answerSelect;
    question.code = payload.answerCode;
    question.answerSelectsCorrect = payload.answerSelects;
    question.answerOrderFragmentCode = payload.answerOrderFragmentCode;
    question.answerOrderLineCode = payload.answerOrderLineCode;
    question.answerFindError = payload.answerFindError;
    await this._questionOfUserRepository.save(question);
  }

  async rateAnswer(
    response: ResponseUserQuestionDto,
    questionOfAssessment: QuestionOfAssessment,
  ) {
    console.log(response, questionOfAssessment);
    let score = 0;
    switch (questionOfAssessment.typeQuestion) {
      case 'selection_single':
        if (
          questionOfAssessment.answerSelectCorrect === response.answerSelect
        ) {
          score = 10;
        } else {
          score = 0;
        }
        break;
      case 'selection_multiple':
        // obtiene las respuestas correctas
        const correctAnswersUser =
          questionOfAssessment.answerSelectsCorrect.filter((answerCorrect) =>
            response.answerSelects.includes(answerCorrect),
          );

        const incorrectAnswerUser = response.answerSelects.filter(
          (answerUser) =>
            !questionOfAssessment.answerSelectsCorrect.includes(answerUser),
        );

        const countAnswerCorrect = correctAnswersUser.length;
        const countAnswerIncorrect = incorrectAnswerUser.length;

        score =
          (10 / Number(questionOfAssessment.answerSelectsCorrect.length)) *
            Number(countAnswerCorrect) -
          Number(countAnswerIncorrect);
        break;
      case 'order_fragment_code':
        if (
          JSON.stringify(questionOfAssessment.answerOrderFragmentCode) ===
          JSON.stringify(response.answerOrderFragmentCode)
        ) {
          score = 10;
        } else {
          score = 0;
        }
        break;
      case 'order_line_code':
        if (
          JSON.stringify(questionOfAssessment.answerOrderLineCode) ===
          JSON.stringify(response.answerOrderLineCode)
        ) {
          score = 10;
        } else {
          score = 0;
        }
        break;
      case 'write_code':
        score = await this._chatCompletionService.getScoreExerciseWriteCode(
          questionOfAssessment.statement,
          response.answerCode,
        );
        break;
      case 'find_error_code':
        if (questionOfAssessment.answerFindError === response.answerFindError) {
          score = 10;
        } else {
          score = 0;
        }
        break;
    }
    return score;
  }

  async initAssessment(assessmentId: number, userId: number) {
    const assessment = await this._assessmentRepository.findOne({
      where: { id: assessmentId },
      relations: ['questions'],
    });
    if (!assessment) {
      throw new Error('Evaluación no encontrada');
    }

    // Desordenas de las preguntas y las limitas
    assessment.questions = assessment.questions
      .sort(() => Math.random() - 0.5)
      .slice(0, assessment.numberOfQuestions);

    const student = await this._user.findOneBy({ id: userId });
    if (!student) {
      throw new Error('Estudiante no encontrado');
    }

    // Verificar si ya ha iniciado una evaluación y la cantidad.
    const [assessmentsOfUser, countAssessmentsOfUser] =
      await this._assessmentOfUserRepository.findAndCount({
        where: {
          assessment: { id: assessmentId },
          student: { id: userId },
        },
      });

    console.log(assessmentsOfUser, countAssessmentsOfUser);

    if (countAssessmentsOfUser === assessment.amountOfAttempt) {
      throw new Error('Ya ha superado la cantidad de intentos');
    }

    const result = await this._entityManager.transaction(
      async (transactionalEntityManager) => {
        // construir una evaluación para el estudiante
        const newAssessmentOfUser = new AssessmentOfUser();
        const questionsOfUser = new Array<QuestionOfUser>();
        newAssessmentOfUser.assessment = assessment;
        newAssessmentOfUser.student = student;

        // Guardamos la evaluación para el estudiante.
        await transactionalEntityManager.save(newAssessmentOfUser);

        assessment.questions.forEach((q) => {
          const question = new QuestionOfUser();
          question.statement = q.statement;
          question.code = q.code;
          question.hind = q.hind;
          question.typeQuestion = q.typeQuestion;
          question.optionSelectOptions = q.optionSelectOptions;
          question.optionOrderFragmentCode = q.optionOrderFragmentCode;
          question.optionOrderLineCode = q.optionOrderLineCode;
          question.optionsFindErrorCode = q.optionsFindErrorCode;
          question.assessmentOfUser = newAssessmentOfUser;
          question.questionOfAssessment = q;
          questionsOfUser.push(question);
        });

        await transactionalEntityManager.save(questionsOfUser);
        return newAssessmentOfUser;
      },
    );

    return { id: result.id };
  }

  async finishAssessmentForStudent(assessmentOfUserId: number) {
    const assessmentOfUser = await this._assessmentOfUserRepository.findOne({
      where: { id: assessmentOfUserId },
      relations: ['questionsOfUser'],
    });

    if (!assessmentOfUser) {
      throw new Error('Evaluación no encontrada');
    }

    let qualification = 0;

    assessmentOfUser.questionsOfUser.forEach((q) => {
      qualification += q.score ? q.score : 0;
    });

    assessmentOfUser.finished = DateTime.utc().toJSDate();
    assessmentOfUser.qualification =
      qualification / assessmentOfUser.questionsOfUser.length;
    const result =
      await this._assessmentOfUserRepository.save(assessmentOfUser);
    return { id: result.id };
  }

  async deleteAssessment(id: number) {
    const assessment = await this._assessmentRepository.findOneBy({ id });
    if (!assessment) {
      throw new Error('Evaluación no encontrada');
    }
    const result = await this._assessmentRepository.softDelete({ id });
    return {
      ok: result.affected > 0,
    };
  }

  @Cron('05 * * * * *')
  async finishedAssessments() {
    console.log('Calificando evaluaciones');
    // Recuperamos todas la evaluaciones finalizadas, los últimos 10 minutos.
    const assessments = await this._assessmentRepository
      .createQueryBuilder('assessment')
      .where(
        "assessment.finished BETWEEN NOW() - INTERVAL '1 day' AND NOW()",
        // "assessment.finished BETWEEN NOW() - INTERVAL '10 minutes' AND NOW()",
      )
      .getMany();

    assessments.forEach(async (assessment) => {
      //  Recuperamos todas las evaluaciones de los estudiantes que no han finalizado.
      const assessmentOfUser = await this._assessmentOfUserRepository.find({
        where: { assessment: { id: assessment.id }, finished: IsNull() },
      });

      assessmentOfUser.forEach((assessmentOfUser) => {
        this.finishAssessmentForStudent(assessmentOfUser.id);
        assessmentOfUser.finished = assessment.finished;
        this._assessmentOfUserRepository.save(assessmentOfUser);
      });
    });
  }
}
