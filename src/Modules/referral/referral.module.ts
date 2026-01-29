import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferralService } from './referral.service';

import { ReferralCode } from '../../Entities/referral_codes';
import { Referral } from '../../Entities/referral.entity';
import { PaymentTransaction } from '../../Entities/payment-transaction';
import { User } from '../../Entities/user.entity';
import { ReferralController } from './referral.controller';
import { ReferralClick } from 'src/Entities/referral_click.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReferralCode,
      ReferralClick,
      Referral,
      PaymentTransaction,
      User,
    ]),
  ],
  controllers: [ReferralController], 
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}
