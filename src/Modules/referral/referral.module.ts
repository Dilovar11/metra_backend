import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Referral } from '../../Entities/referral.entity';
import { User } from '../../Entities/user.entity';
import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Referral, User])],
  providers: [ReferralService],
  controllers: [ReferralController],
})
export class ReferralModule {}
