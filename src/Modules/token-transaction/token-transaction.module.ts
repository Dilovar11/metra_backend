import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenTransaction } from '../../Entities/token-transaction.entity';
import { TokenBalance } from '../../Entities/token-balance.entity';
import { User } from '../../Entities/user.entity';
import { TokenTransactionService } from './token-transaction.service';
import { TokenTransactionController } from './token-transaction.controller';
import { PaymentTransaction } from '../../Entities/payment-transaction';
import { TokenBalanceModule } from '../token-balance/token-balance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TokenTransaction, User, PaymentTransaction]),
    TokenBalanceModule
  ],
  providers: [TokenTransactionService],
  controllers: [TokenTransactionController],
  exports: [TokenTransactionService],
})
export class TokenTransactionModule {}
