import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nombre de la API Key (ej: GEMINI_API_KEY)' })
  keyName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Valor de la API Key' })
  keyValue: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Descripción de la API Key', required: false })
  description?: string;
}

export class UpdateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nuevo valor de la API Key' })
  keyValue: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Descripción actualizada', required: false })
  description?: string;
}

export class ApiKeyDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  keyName: string;

  @ApiProperty()
  maskedValue: string; // Solo muestra primeros y últimos 4 caracteres

  @ApiProperty()
  description: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdBy: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiProperty()
  updatedBy: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class ApiKeyHistoryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  action: string;

  @ApiProperty()
  previousValue: string;

  @ApiProperty()
  newValue: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  performedBy: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiProperty()
  ipAddress: string;

  @ApiProperty()
  createdAt: string;
}
