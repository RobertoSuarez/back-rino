import { User } from '../../database/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ enum: ['terms-and-conditions', 'privacy-policies'] })
  typeDocument: string;

  @ManyToOne(() => User, (user) => user.documents)
  createdBy: User;
}
