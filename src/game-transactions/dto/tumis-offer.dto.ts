import { IsNumber, IsNotEmpty } from 'class-validator';

export class TumisOfferDto {
  id: number;
  tumisAmount: number;
  mulluCost: number;
  isPromotion: boolean;
  promotionLabel?: string;
  discount?: number; // porcentaje de descuento
  description: string;
}

export class BuyTumisDto {
  @IsNumber()
  @IsNotEmpty()
  offerId: number;

  userId?: number; // Se asigna desde el controlador
}

export class TumisTransactionResponseDto {
  success: boolean;
  message: string;
  transaction: {
    id: number;
    userId: number;
    resourceType: string;
    transactionType: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    description: string;
    createdAt: Date;
  };
  userBalance: {
    tumis: number;
    mullu: number;
  };
}
