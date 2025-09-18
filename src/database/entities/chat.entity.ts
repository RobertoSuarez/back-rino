import { BaseTable } from '../../common/entities/base.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ChatMessage } from './chatMessage.entity';

@Entity()
export class Chat extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.chats)
  user: User;

  @Column()
  title: string;

  @Column({ nullable: true, default: 'general' })
  type: string;

  // Un Chat tiene muchos mensajes.
  @OneToMany(() => ChatMessage, (m) => m.chat)
  messages: ChatMessage[];
}
