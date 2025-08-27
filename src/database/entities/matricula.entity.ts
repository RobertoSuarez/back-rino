import { BaseTable } from '../../common/entities/base.entity';
import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Classes } from './classes.entity';

@Entity()
export class Matricula extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.matriculas)
  student: User;

  @ManyToOne(() => Classes, (c) => c.matriculas)
  class: Classes;
}
