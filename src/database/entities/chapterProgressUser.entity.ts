import { User } from '../../database/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Chapter } from './chapter.entity';

@Entity()
export class ChapterProgressUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ default: 0 })
  progress: number;

  @ManyToOne(() => User, (user) => user.chapterProgressUser)
  user: User;

  @ManyToOne(() => Chapter, (chapter) => chapter.chapterProgressUsers)
  chapter: Chapter;
}
