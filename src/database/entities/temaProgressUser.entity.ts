import { User } from '../../database/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Tema } from './tema.entity';

@Entity()
export class TemaProgressUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ default: 0 })
  progress: number;

  @ManyToOne(() => User, (user) => user.temaProgressUser)
  user: User;

  @ManyToOne(() => Tema, (t) => t.temaProgressUsers)
  tema: Tema;
}
