import { BaseTable } from '../../common/entities/base.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Activity } from './activity.entity';

@Entity()
export class ActivityProgressUser extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (u) => u.activityProgressUsers)
  user: User;

  @Column({ default: 0 })
  progress: number;

  @Column({ type: 'float', default: 0 })
  score: number;

  @Column({ type: 'float', default: 0 })
  accuracy: number;

  @ManyToOne(() => Activity, (a) => a.activityProgressUsers)
  activity: Activity;
}
