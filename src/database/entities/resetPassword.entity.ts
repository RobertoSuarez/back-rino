import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class ResetPassword {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  email: string;

  @Column()
  token: string;

  @Column()
  used: boolean;

  @ManyToOne(() => User, (user) => user.resetPasswords)
  user: User;
}
