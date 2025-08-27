import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { BaseTable } from '../../common/entities/base.entity';

@Entity()
export class ConfigKey extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.configKeys)
  createdBy: User;

  @Column()
  serviceName: string;

  @Column()
  key: string;
}
