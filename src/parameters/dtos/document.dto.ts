import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DocumentDto {
  @Expose()
  @ApiProperty()
  title: string;

  @Expose()
  @ApiProperty()
  content: string;

  @Expose()
  @ApiProperty()
  typeDocument: string;
}
