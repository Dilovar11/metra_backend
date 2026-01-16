import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Referral } from 'src/Entities/referral.entity';
import { User } from 'src/Entities/user.entity';
import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Referral, User])],
  providers: [ReferralService],
  controllers: [ReferralController],
})
export class ReferralModule {}
