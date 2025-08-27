import { BaseTable } from '../../common/entities/base.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Chapter } from './chapter.entity';
import { TemaProgressUser } from './temaProgressUser.entity';
import { Activity } from './activity.entity';

@Entity()
export class Tema extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  shortDescription: string;

  @Column({ type: 'text', default: '' })
  theory: string;

  @Column({ nullable: true })
  urlBackground: string;

  @Column({ default: 0 })
  index: number;

  @Column({ default: 'Fácil' })
  difficulty: string;

  @ManyToOne(() => Chapter, (c) => c.temas)
  chapter: Chapter;

  @OneToMany(() => TemaProgressUser, (t) => t.tema)
  temaProgressUsers: TemaProgressUser[];

  @OneToMany(() => Activity, (a) => a.tema)
  activities: Activity[];
}
