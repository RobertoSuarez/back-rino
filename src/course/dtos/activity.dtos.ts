import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateActivityDto {
  @ApiProperty()
  @IsNumber({}, { message: 'El tema es requerido' })
  @IsNotEmpty({ message: 'El tema es requerido' })
  temaId: number;

  @ApiProperty()
  @IsString({ message: 'El título debe ser un string' })
  @IsNotEmpty({ message: 'El título es requerido' })
  title: string;
}

export class UpdateActivityDto extends PartialType(CreateActivityDto) {}

export class ActivityDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
