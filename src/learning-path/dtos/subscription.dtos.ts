import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SubscribeToPathDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Código de la ruta de aprendizaje' })
  code: string;
}

export class SubscriptionDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  learningPath: {
    id: number;
    name: string;
    code: string;
    description: string;
    coursesCount: number;
  };

  @ApiProperty()
  subscribedAt: string;

  @ApiProperty()
  isActive: boolean;
}
