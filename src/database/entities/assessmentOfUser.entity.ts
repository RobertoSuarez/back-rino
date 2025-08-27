import { BaseTable } from '../../common/entities/base.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Assessment } from './assessment.entity';
import { User } from './user.entity';
import { QuestionOfUser } from './questionOfUser.entity';

@Entity()
export class AssessmentOfUser extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Assessment, (a) => a.assessmentsOfUsers)
  assessment: Assessment;

  @ManyToOne(() => User, (u) => u.assessmentsOfUsers)
  student: User;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  started: Date;

  @Column({ type: 'timestamptz', nullable: true })
  finished: Date;

  @Column({ type: 'float', nullable: true })
  qualification: number;

  @OneToMany(() => QuestionOfUser, (q) => q.assessmentOfUser)
  questionsOfUser: QuestionOfUser[];
}
