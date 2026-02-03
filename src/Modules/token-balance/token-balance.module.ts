import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenBalance } from '../../Entities/token-balance.entity';
import { User } from '../../Entities/user.entity';
import { TokenBalanceService } from './token-balance.service';
import { TokenBalanceController } from './token-balance.controller';
import { ReferralBalance } from '../../Entities/referral-balance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TokenBalance, User])],
  providers: [TokenBalanceService],
  controllers: [TokenBalanceController],
})
export class TokenBalanceModule {}
