import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { NanoBananaModule } from './Modules/nanobanana/nanobanana.module';


import { Avatar } from './Entities/avatar.entity';
import { BodyPhoto } from './Entities/body-photo.entity';
import { GenerationMedia } from './Entities/generation-media.entity';
import { Generation } from './Entities/generation.entity';
import { Purchase } from './Entities/purchase.entity';
import { Referral } from './Entities/referral.entity';
import { Subscription } from './Entities/subscription.entity';
import { SupportTicket } from './Entities/support-ticket.entity';
import { TokenBalance } from './Entities/token-balance.entity';
import { TokenTransaction } from './Entities/token-transaction.entity';
import { User } from './Entities/user.entity';
import { UsersModule } from './Modules/user/users.module';
import { AvatarModule } from './Modules/avatar/avatar.module';
import { BodyPhotoModule } from './Modules/body-photo/body-photo.module';
import { GenerationMediaModule } from './Modules/generation-media/generation-media.module';
import { GenerationModule } from './Modules/generation/generation.module';
import { PurchaseModule } from './Modules/purchase/purchase.module';
import { ReferralModule } from './Modules/referral/referral.module';
import { SubscriptionModule } from './Modules/subscription/subscription.module';
import { SupportTicketModule } from './Modules/support-ticket/support-ticket.module';
import { TokenBalanceModule } from './Modules/token-balance/token-balance.module';
import { TokenTransactionModule } from './Modules/token-transaction/token-transaction.module';

dotenv.config();

@Module({
  imports: [
    NanoBananaModule,
    UsersModule,
    AvatarModule,
    BodyPhotoModule,
    GenerationMediaModule,
    GenerationModule,
    PurchaseModule,
    ReferralModule,
    SubscriptionModule,
    SupportTicketModule,
    TokenBalanceModule,
    TokenTransactionModule,
    
    TypeOrmModule.forRoot({
           type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,

      synchronize: true,
      logging: false,

      entities: [
        Avatar,
        BodyPhoto,
        GenerationMedia,
        Generation,
        Purchase,
        Referral,
        Subscription,
        SupportTicket,
        TokenBalance,
        TokenTransaction,
        User
      ],
    }),
  ],
})
export class AppModule {}
