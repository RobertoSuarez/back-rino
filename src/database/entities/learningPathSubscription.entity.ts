import { BaseTable } from '../../common/entities/base.entity';
import { User } from './user.entity';
import { LearningPath } from './learningPath.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['student', 'learningPath'])
export class LearningPathSubscription extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.learningPathSubscriptions)
  student: User;

  @ManyToOne(() => LearningPath, (learningPath) => learningPath.subscriptions)
  learningPath: LearningPath;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  subscribedAt: Date;

  @Column({ default: true })
  isActive: boolean;
}
