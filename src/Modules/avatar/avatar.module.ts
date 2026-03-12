import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Avatar } from '../../Entities/avatar.entity';
import { User } from '../../Entities/user.entity';
import { AvatarService } from './avatar.service';
import { AvatarController } from './avatar.controller';
import { SubscriptionModule } from '../subscription/subscription.module';
import { TokenBalanceModule } from '../token-balance/token-balance.module';
import { FilesModule } from '../file/file.module';

@Module({
  imports: [TypeOrmModule.forFeature([Avatar, User]), SubscriptionModule, TokenBalanceModule, FilesModule],
  providers: [AvatarService],
  controllers: [AvatarController],
})
export class AvatarModule {}
