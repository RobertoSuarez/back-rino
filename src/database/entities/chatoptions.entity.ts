import { BaseTable } from '../../common/entities/base.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ChatOptions extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  shortDescription: string;

  @Column()
  allDescription: string;

  @Column()
  icon: string;
}
