import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Course } from './course.entity';
import { ChapterProgressUser } from './chapterProgressUser.entity';
import { BaseTable } from '../../common/entities/base.entity';
import { Tema } from './tema.entity';

@Entity()
export class Chapter extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Course, (course) => course.chapters)
  course: Course;

  @Column({ default: 'Sin titulo' })
  title: string;

  @Column({ default: 'Sin descripción' })
  shortDescription: string;

  @Column({ default: 0 })
  index: number;

  @Column({ default: 'Fácil' })
  difficulty: string;

  @OneToMany(() => ChapterProgressUser, (c) => c.chapter)
  chapterProgressUsers: ChapterProgressUser[];

  @OneToMany(() => Tema, (t) => t.chapter)
  temas: Tema[];
}
