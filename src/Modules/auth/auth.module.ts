import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from 'src/Entities/user.entity';
import { Referral } from 'src/Entities/referral.entity';
import { ReferralCode } from 'src/Entities/referral_codes';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Referral, ReferralCode])
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService] 
})
export class AuthModule {}