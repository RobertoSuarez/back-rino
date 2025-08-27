import { BaseTable } from '../../common/entities/base.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Classes } from './classes.entity';
import { QuestionOfAssessment } from './questionOfAssessment.entity';
import { AssessmentOfUser } from './assessmentOfUser.entity';

// Evaluación plantilla donde se guardara las evaluaciones para los estudiantes.
@Entity()
export class Assessment extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Classes, (c) => c.assessments)
  class: Classes;

  @Column()
  title: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  started: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  finished: Date;

  @Column({ default: '00:30:00' })
  timeLimit: string;

  @Column({ default: 'teórica' })
  contentFocus: string;

  @Column({ default: 'formativa' })
  typeAssessment: string;

  @Column({ default: 1 })
  amountOfAttempt: number;

  @Column({ default: 10 })
  numberOfQuestions: number;

  @OneToMany(() => QuestionOfAssessment, (q) => q.assessment)
  questions: QuestionOfAssessment[];

  @OneToMany(() => AssessmentOfUser, (a) => a.assessment)
  assessmentsOfUsers: AssessmentOfUser[];
}
