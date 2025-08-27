import { BaseTable } from '../../common/entities/base.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tema } from './tema.entity';
import { Exercise } from './exercise.entity';
import { ActivityProgressUser } from './activityProgress.entity';

@Entity()
export class Activity extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Tema, (t) => t.activities)
  tema: Tema;

  @Column()
  title: string;

  @OneToMany(() => Exercise, (e) => e.activity)
  exercises: Exercise[];

  @OneToMany(() => ActivityProgressUser, (a) => a.activity)
  activityProgressUsers: ActivityProgressUser[];
}
