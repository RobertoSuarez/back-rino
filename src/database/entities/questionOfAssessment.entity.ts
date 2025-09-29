import { BaseTable } from '../../common/entities/base.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Assessment } from './assessment.entity';
import { QuestionOfUser } from './questionOfUser.entity';

@Entity()
export class QuestionOfAssessment extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Assessment, (a) => a.questions)
  assessment: Assessment;

  @Column()
  statement: string;

  @Column({ default: 'Fácil' })
  difficulty: string;

  @Column({ nullable: true })
  code: string;

  @Column({ nullable: true })
  hind: string;

  @Column({
    enum: [
      'selection_single',
      'selection_multiple',
      'order_fragment_code',
      'order_line_code',
      'write_code',
      'find_error_code',
      'vertical_ordering',
      'horizontal_ordering',
      'phishing_selection_multiple',
      'match_pairs',
      'true_false',
    ],
    default: 'selection_single',
  })
  typeQuestion:
    | 'selection_single'
    | 'selection_multiple'
    | 'order_fragment_code' // VARIAS LINEAS
    | 'order_line_code' // DE SOLO UNA LINEA
    | 'write_code'
    | 'find_error_code'
    | 'vertical_ordering'
    | 'horizontal_ordering'
    | 'phishing_selection_multiple'
    | 'match_pairs'
    | 'true_false';

  @Column({ type: 'json', default: [], nullable: true })
  optionSelectOptions: string[];

  @Column({ type: 'json', default: [], nullable: true })
  optionOrderFragmentCode: string[];

  @Column({ type: 'json', default: [], nullable: true })
  optionOrderLineCode: string[];

  @Column({ type: 'json', default: [], nullable: true })
  optionsFindErrorCode: string[];

  @Column({ type: 'json', default: [], nullable: true })
  verticalOrdering: string[];

  @Column({ type: 'json', default: [], nullable: true })
  horizontalOrdering: string[];

  @Column({ type: 'json', default: [], nullable: true })
  phishingSelectionMultiple: string[];

  @Column({ type: 'json', default: [], nullable: true })
  matchPairs: string[];

  // Los siguientes campos son las respuestas de las diferentes preguntas.
  @Column({ default: null, nullable: true })
  answerSelectCorrect: string;

  @Column({ type: 'json', default: [], nullable: true })
  answerSelectsCorrect: string[];

  @Column({ type: 'json', default: [], nullable: true })
  answerOrderFragmentCode: string[];

  @Column({ type: 'json', default: [], nullable: true })
  answerOrderLineCode: string[];

  @Column({ nullable: true })
  answerFindError: string;

  @OneToMany(() => QuestionOfUser, (q) => q.questionOfAssessment)
  questionsOfUser: QuestionOfUser[];
}
