import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Assessment } from '../../../database/entities/assessment.entity';
import { QuestionOfAssessment } from '../../../database/entities/questionOfAssessment.entity';
import { Repository } from 'typeorm';
import { CreateQuestionDto, UpdateQuestionDto } from '../../dtos/question.dtos';

@Injectable()
export class QuestionOfAssessmentService {
  constructor(
    @InjectRepository(Assessment)
    private _assessmentRepository: Repository<Assessment>,
    @InjectRepository(QuestionOfAssessment)
    private _questionOfAssessmentRepository: Repository<QuestionOfAssessment>,
  ) {}

  async getQuestionsByIdAssessment(assessmentId: number) {
    const assessment = await this._assessmentRepository.findOneBy({
      id: assessmentId,
    });
    if (!assessment) {
      throw new Error('Evaluación no encontrada');
    }
    const result = await this._questionOfAssessmentRepository
      .createQueryBuilder('question')
      .innerJoinAndSelect('question.assessment', 'assessment')
      .where('question.assessment = :assessmentId', { assessmentId })
      .getMany();

    return result.map((question) => {
      return {
        id: question.id,
        statement: question.statement,
        difficulty: question.difficulty,
        code: question.code,
        hind: question.hind,
        typeQuestion: question.typeQuestion,
        optionSelectOptions: question.optionSelectOptions,
        optionOrderFragmentCode: question.optionOrderFragmentCode,
        optionOrderLineCode: question.optionOrderLineCode,
        optionsFindErrorCode: question.optionsFindErrorCode,
        answerSelectCorrect: question.answerSelectCorrect,
        answerSelectsCorrect: question.answerSelectsCorrect,
        answerOrderFragmentCode: question.answerOrderFragmentCode,
        answerOrderLineCode: question.answerOrderLineCode,
        answerFindError: question.answerFindError,
        assessmentId: question.assessment.id,
      };
    });
  }

  async CreateQuestion(payload: CreateQuestionDto) {
    const assessment = await this._assessmentRepository.findOneBy({
      id: payload.assessmentId,
    });

    if (!assessment) {
      throw new Error('Evaluación no encontrada');
    }

    const question = new QuestionOfAssessment();
    question.statement = payload.statement;
    question.difficulty = payload.difficulty;
    question.code = payload.code;
    question.hind = payload.hind;
    question.typeQuestion = payload.typeQuestion;
    question.optionSelectOptions = payload.optionSelectOptions;
    question.optionOrderFragmentCode = payload.optionOrderFragmentCode;
    question.optionOrderLineCode = payload.optionOrderLineCode;
    question.optionsFindErrorCode = payload.optionsFindErrorCode;

    // Respuesta correcta.
    question.answerSelectCorrect = payload.answerSelectCorrect;
    question.answerSelectsCorrect = payload.answerSelectsCorrect;
    question.answerOrderFragmentCode = payload.answerOrderFragmentCode;
    question.answerOrderLineCode = payload.answerOrderLineCode;
    question.answerFindError = payload.answerFindError;

    question.assessment = assessment;
    const result = await this._questionOfAssessmentRepository.save(question);
    return {
      id: result.id,
    };
  }

  async CreateQuestionMassive(
    assessmentId: number,
    payload: CreateQuestionDto[],
  ) {
    const assessment = await this._assessmentRepository.findOneBy({
      id: assessmentId,
    });

    if (!assessment) {
      throw new Error('Evaluación no encontrada');
    }

    const questions = payload.map((question) => {
      const newQuestion = new QuestionOfAssessment();
      newQuestion.statement = question.statement;
      newQuestion.difficulty = question.difficulty;
      newQuestion.code = question.code;
      newQuestion.hind = question.hind;
      newQuestion.typeQuestion = question.typeQuestion;
      newQuestion.optionSelectOptions = question.optionSelectOptions;
      newQuestion.optionOrderFragmentCode = question.optionOrderFragmentCode;
      newQuestion.optionOrderLineCode = question.optionOrderLineCode;
      newQuestion.optionsFindErrorCode = question.optionsFindErrorCode;

      // Respuesta correcta.
      newQuestion.answerSelectCorrect = question.answerSelectCorrect;
      newQuestion.answerSelectsCorrect = question.answerSelectsCorrect;
      newQuestion.answerOrderFragmentCode = question.answerOrderFragmentCode;
      newQuestion.answerOrderLineCode = question.answerOrderLineCode;
      newQuestion.answerFindError = question.answerFindError;

      newQuestion.assessment = assessment;
      return newQuestion;
    });
    const result = await this._questionOfAssessmentRepository.save(questions);
    return result.map((q) => ({
      id: q.id,
    }));
  }

  async deleteQuestion(id: number) {
    const question = await this._questionOfAssessmentRepository.findOneBy({
      id,
    });

    if (!question) {
      throw new Error('Pregunta no encontrada');
    }

    const result = await this._questionOfAssessmentRepository.softDelete({
      id,
    });
    return {
      ok: result.affected > 0,
    };
  }

  async updateQuestion(id: number, payload: UpdateQuestionDto) {
    const question = await this._questionOfAssessmentRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.assessment', 'assessment')
      .where('question.id = :id', { id })
      .getOne();

    if (!question) {
      throw new Error('Pregunta no encontrada');
    }

    question.statement = payload.statement;
    question.difficulty = payload.difficulty;
    question.code = payload.code;
    question.hind = payload.hind;
    question.typeQuestion = payload.typeQuestion;
    question.optionSelectOptions = payload.optionSelectOptions;
    question.optionOrderFragmentCode = payload.optionOrderFragmentCode;
    question.optionOrderLineCode = payload.optionOrderLineCode;
    question.optionsFindErrorCode = payload.optionsFindErrorCode;

    // Respuesta correcta.
    question.answerSelectCorrect = payload.answerSelectCorrect;
    question.answerSelectsCorrect = payload.answerSelectsCorrect;
    question.answerOrderFragmentCode = payload.answerOrderFragmentCode;
    question.answerOrderLineCode = payload.answerOrderLineCode;
    question.answerFindError = payload.answerFindError;
    const result = await this._questionOfAssessmentRepository.save(question);
    return {
      id: result.id,
      statement: result.statement,
      // options: result.options,
      // correctAnswer: result.correctAnswer,
      assessmentId: result.assessment.id,
    };
  }
}
