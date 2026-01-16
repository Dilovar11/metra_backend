import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenTransaction } from 'src/Entities/token-transaction.entity';
import { TokenBalance } from 'src/Entities/token-balance.entity';
import { User } from 'src/Entities/user.entity';
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
