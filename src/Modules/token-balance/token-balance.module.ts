// token-balance.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenBalanceService } from './token-balance.service';
import { TokenBalance } from '../../Entities/token-balance.entity';
import { User } from '../../Entities/user.entity';
import { ReferralBalance } from '../../Entities/referral-balance.entity'; // <-- Проверьте этот путь!

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TokenBalance, 
      User, 
      ReferralBalance // Это обязательная строка!
    ]),
  ],
  providers: [TokenBalanceService],
  exports: [TokenBalanceService],
})
export class TokenBalanceModule {}