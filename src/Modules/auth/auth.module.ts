import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../../Entities/user.entity';
import { Referral } from '../../Entities/referral.entity';
import { ReferralCode } from '../../Entities/referral_codes';
import { ReferralModule } from '../referral/referral.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Referral, ReferralCode]),
    ReferralModule
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService] 
})
export class AuthModule {}