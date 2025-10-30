import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateInstitutionDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}
