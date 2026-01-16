import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../../Entities/user.entity';
import { Avatar } from '../../Entities/avatar.entity';
import { BodyPhoto } from '../../Entities/body-photo.entity';
import { TokenBalance } from '../../Entities/token-balance.entity';
import { Subscription } from '../../Entities/subscription.entity';
import { Generation } from '../../Entities/generation.entity';
import { Purchase } from '../../Entities/purchase.entity';
import { Referral } from '../../Entities/referral.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Avatar,
      BodyPhoto,
      TokenBalance,
      Subscription,
      Generation,
      Purchase,
      Referral
    ])
  ],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
