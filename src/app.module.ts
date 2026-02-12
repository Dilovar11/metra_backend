import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { AvatarGeneratorModule } from './NanoBanana-API/avatar/generate-avatar.module';
import { ImageGeneratorModule } from './NanoBanana-API/generation-image/image-generator.module';
import { FilesModule } from './Modules/file/file.module';
import { CorrectionImageModule } from './NanoBanana-API/correction-image/correction-image.module';
import { AuthModule } from './Modules/auth/auth.module';
import { SceneModule } from './Modules/scene/scene.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,

      ssl: {
        rejectUnauthorized: false,
      },

      autoLoadEntities: true,
      synchronize: true,
      logging: false,

      extra: {
        max: 5,
        connectionTimeoutMillis: 5000, 
      },
    }),
    AuthModule,
    AvatarGeneratorModule,
    AvatarModule,
    ImageGeneratorModule,
    GenerationModule,
    SceneModule,
    FilesModule,
    CorrectionImageModule,
    UsersModule,
    ReferralModule,
    TokenBalanceModule,
    TokenTransactionModule,
    BodyPhotoModule,
    GenerationMediaModule,
    PurchaseModule,
    SubscriptionModule,
    SupportTicketModule,
  ],
})
export class AppModule { }
