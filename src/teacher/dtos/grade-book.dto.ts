import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertGradeDto {
  @ApiProperty({ description: 'ID de la suscripción (student + learningPath)' })
  @IsNumber()
  subscriptionId: number;

  @ApiProperty({ description: 'Nota final (0–10)', minimum: 0, maximum: 10 })
  @IsNumber()
  @Min(0)
  @Max(10)
  finalGrade: number;

  @ApiPropertyOptional({ description: 'Observaciones del docente' })
  @IsOptional()
  @IsString()
  observations?: string;
}

export class BulkGradeDto {
  @ApiProperty({ type: [UpsertGradeDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UpsertGradeDto)
  grades: UpsertGradeDto[];
}
