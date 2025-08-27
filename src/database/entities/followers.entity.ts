import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { BaseTable } from '../../common/entities/base.entity';

@Entity()
export class Followers extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  // user que sigue a otro
  @ManyToOne(() => User, (user) => user.followers)
  follower: User;

  // user que he seguido
  @ManyToOne(() => User, (user) => user.myFollowers)
  followed: User;
}
