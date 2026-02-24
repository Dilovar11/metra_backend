import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Avatar } from '../../Entities/avatar.entity';
import { User } from '../../Entities/user.entity';
import { AvatarService } from './avatar.service';
import { AvatarController } from './avatar.controller';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [TypeOrmModule.forFeature([Avatar, User]), SubscriptionModule],
  providers: [AvatarService],
  controllers: [AvatarController],
})
export class AvatarModule {}
