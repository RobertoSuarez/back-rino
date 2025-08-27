import { BaseTable } from '../../common/entities/base.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Chat } from './chat.entity';

@Entity()
export class ChatMessage extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Chat, (chat) => chat.messages)
  chat: Chat;

  @Column({ type: 'text' })
  content: string;

  @Column()
  role: string;
}
