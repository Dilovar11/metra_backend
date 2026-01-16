import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Purchase } from 'src/Entities/purchase.entity';
import { User } from 'src/Entities/user.entity';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Purchase, User])],
  providers: [PurchaseService],
  controllers: [PurchaseController],
})
export class PurchaseModule {}

