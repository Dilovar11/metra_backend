import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from '../../Entities/subscription.entity';
import { User } from '../../Entities/user.entity';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, User]), ScheduleModule.forRoot()],
  providers: [SubscriptionService],
  controllers: [SubscriptionController],
  exports: [SubscriptionService]
})
export class SubscriptionModule {}
