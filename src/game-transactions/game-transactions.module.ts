import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameTransactionsController } from './game-transactions.controller';
import { GameTransactionsService } from './game-transactions.service';
import { TransactionHelper } from './helpers/transaction.helper';
import { GameCronService } from './services/game-cron.service';
import { TumisShopService } from './services/tumis-shop.service';
import { TumisShopController } from './controllers/tumis-shop.controller';
import { GameTransaction } from '../database/entities/gameTransaction.entity';
import { User } from '../database/entities/user.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameTransaction, User]),
    forwardRef(() => UserModule),
  ],
  controllers: [GameTransactionsController, TumisShopController],
  providers: [GameTransactionsService, TransactionHelper, GameCronService, TumisShopService],
  exports: [GameTransactionsService, TransactionHelper, TumisShopService],
})
export class GameTransactionsModule {}
