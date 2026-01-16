import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenBalance } from 'src/Entities/token-balance.entity';
import { User } from 'src/Entities/user.entity';
import { TokenBalanceService } from './token-balance.service';
import { TokenBalanceController } from './token-balance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TokenBalance, User])],
  providers: [TokenBalanceService],
  controllers: [TokenBalanceController],
})
export class TokenBalanceModule {}
