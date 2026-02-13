// token-balance.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenBalanceService } from './token-balance.service';
import { TokenBalance } from '../../Entities/token-balance.entity';
import { User } from '../../Entities/user.entity';
import { ReferralBalance } from '../../Entities/referral-balance.entity'; // <-- Проверьте этот путь!
import { TokenBalanceController } from './token-balance.controller';
import { TokenTransaction } from '../../Entities/token-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TokenBalance, 
      User, 
      ReferralBalance,
      TokenTransaction
    ]),
  ],
  providers: [TokenBalanceService],
  exports: [TokenBalanceService],
  controllers: [TokenBalanceController]
})
export class TokenBalanceModule {}