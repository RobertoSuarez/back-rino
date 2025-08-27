import { BaseTable } from '../../common/entities/base.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AssessmentOfUser } from './assessmentOfUser.entity';
import { QuestionOfAssessment } from './questionOfAssessment.entity';

@Entity()
export class QuestionOfUser extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AssessmentOfUser, (a) => a.questionsOfUser)
  assessmentOfUser: AssessmentOfUser;

  @Column()
  statement: string;

  @Column({ default: null, nullable: true })
  code: string;

  @Column({ default: null, nullable: true })
  hind: string;

  @Column({
    enum: [
      'selection_single',
      'selection_multiple',
      'order_fragment_code',
      'order_line_code',
      'write_code',
      'find_error_code',
    ],
    default: 'selection_single',
  })
  typeQuestion:
    | 'selection_single'
    | 'selection_multiple'
    | 'order_fragment_code' // VARIAS LINEAS
    | 'order_line_code' // DE SOLO UNA LINEA
    | 'write_code'
    | 'find_error_code';

  @Column({ type: 'json', default: null, nullable: true })
  optionSelectOptions: string[];

  @Column({ type: 'json', default: null, nullable: true })
  optionOrderFragmentCode: string[];

  @Column({ type: 'json', default: null, nullable: true })
  optionOrderLineCode: string[];

  @Column({ type: 'json', default: null, nullable: true })
  optionsFindErrorCode: string[];

  // Los siguientes campos son las respuestas de las diferentes preguntas.
  // son las respuesta del usuario.
  @Column({ default: null, nullable: true })
  answerSelectCorrect: string;

  @Column({ type: 'json', default: null, nullable: true })
  answerSelectsCorrect: string[];

  @Column({ type: 'json', default: null, nullable: true })
  answerOrderFragmentCode: string[];

  @Column({ type: 'json', default: null, nullable: true })
  answerOrderLineCode: string[];

  @Column({ default: null, nullable: true })
  answerFindError: string;

  @Column({ default: 0 })
  score: number;

  @ManyToOne(() => QuestionOfAssessment, (q) => q.questionsOfUser)
  questionOfAssessment: QuestionOfAssessment;
}
