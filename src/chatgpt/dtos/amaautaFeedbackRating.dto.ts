import { IsNotEmpty, IsNumber, Min, Max, IsOptional, IsString } from 'class-validator';

export class CreateAmaautaFeedbackRatingDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number; // 1-5

  @IsOptional()
  @IsNumber()
  userId?: number; // Se asigna en el controlador desde el usuario autenticado

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsString()
  userAnswer?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  exerciseType?: string;

  @IsOptional()
  @IsNumber()
  exerciseId?: number;

  @IsOptional()
  @IsString()
  activityName?: string;

  @IsOptional()
  @IsNumber()
  exerciseQualification?: number;
}

export class AmaautaFeedbackRatingDto {
  id: number;
  userId: number;
  rating: number;
  feedback?: string;
  userAnswer?: string;
  comment?: string;
  exerciseType?: string;
  exerciseId?: number;
  activityName?: string;
  exerciseQualification?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class AmaautaFeedbackRatingStatsDto {
  totalRatings: number;
  averageRating: number;
  ratingDistribution: {
    [key: number]: number; // rating: count
  };
  recentRatings: AmaautaFeedbackRatingDto[];
}
