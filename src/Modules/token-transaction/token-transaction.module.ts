import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenTransaction } from '../../Entities/token-transaction.entity';
import { TokenBalance } from '../../Entities/token-balance.entity';
import { User } from '../../Entities/user.entity';
import { TokenTransactionService } from './token-transaction.service';
import { TokenTransactionController } from './token-transaction.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TokenTransaction, TokenBalance, User]),
  ],
  providers: [TokenTransactionService],
  controllers: [TokenTransactionController],
})
export class TokenTransactionModule {}
