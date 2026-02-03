import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenBalanceService } from './token-balance.service';
import { TokenBalance } from '../../Entities/token-balance.entity';
import { User } from '../../Entities/user.entity';
import { ReferralBalance } from '../../Entities/referral-balance.entity'; // Импортируйте вашу новую сущность
import { TokenBalanceController } from './token-balance.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TokenBalance, 
      User, 
      ReferralBalance // ДОБАВЬТЕ ЭТУ СТРОКУ
    ]),
  ],
  providers: [TokenBalanceService],
  exports: [TokenBalanceService],
  controllers: [TokenBalanceController]
})
export class TokenBalanceModule {}
 
