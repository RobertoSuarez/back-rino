import { BaseTable } from '../../common/entities/base.entity';
import { User } from '../../database/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Course } from './course.entity';

@Entity()
export class Subscription extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.subscriptions)
  user: User;

  @ManyToOne(() => Course, (course) => course.subscriptions)
  course: Course;

  @Column({ default: 0 })
  progreso: number;
}
