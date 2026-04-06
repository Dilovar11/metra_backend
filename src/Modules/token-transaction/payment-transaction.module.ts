import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenTransaction } from '../../Entities/token-transaction.entity';
import { TokenBalance } from '../../Entities/token-balance.entity';
import { User } from '../../Entities/user.entity';
import { TokenTransactionService } from './payment-transaction.service';
import { TokenTransactionController } from './payment-transaction.controller';
import { PaymentTransaction } from '../../Entities/payment-transaction';
import { TokenBalanceModule } from '../token-balance/token-balance.module';
import { Referral } from '../../Entities/referral.entity';
import { PaymentSettings } from '../../Entities/payment-settings.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TokenTransaction, User, PaymentTransaction, Referral, PaymentSettings]),
    TokenBalanceModule
  ],
  providers: [TokenTransactionService],
  controllers: [TokenTransactionController],
  exports: [TokenTransactionService],
})
export class TokenTransactionModule {}
