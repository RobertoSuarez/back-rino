import { BaseTable } from '../../common/entities/base.entity';
import { User } from './user.entity';
import { Course } from './course.entity';
import { LearningPathSubscription } from './learningPathSubscription.entity';
import {
  Column,
  Entity,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinTable,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class LearningPath extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true, nullable: true })
  code: string;

  @Column({ type: 'text' })
  description: string;

  @ManyToOne(() => User, (user) => user.learningPaths)
  createdBy: User;

  @ManyToMany(() => Course)
  @JoinTable({
    name: 'learning_path_courses',
    joinColumn: { name: 'learning_path_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'course_id', referencedColumnName: 'id' },
  })
  courses: Course[];

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => LearningPathSubscription, (lps) => lps.learningPath)
  subscriptions: LearningPathSubscription[];
}
