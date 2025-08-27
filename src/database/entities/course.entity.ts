import { BaseTable } from '../../common/entities/base.entity';
import { User } from '../../database/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Subscription } from './subscription.entity';
import { Chapter } from './chapter.entity';

@Entity()
export class Course extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.courses)
  createdBy: User;

  @Column()
  title: string;

  @Column({ default: '' })
  description: string;

  @Column({ type: 'varchar', length: 200 })
  code: string;

  @Column({ nullable: true })
  urlLogo: string;

  @Column({ default: 0 })
  index: number;

  @Column({ default: false })
  isPublic: boolean;

  @OneToMany(() => Subscription, (subscription) => subscription.course)
  subscriptions: Subscription[];

  @OneToMany(() => Chapter, (chapter) => chapter.course)
  chapters: Chapter[];
}
