export class InstitutionDto {
  id: number;
  name: string;
  description: string;
  logoUrl: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  userCount?: number;
}
