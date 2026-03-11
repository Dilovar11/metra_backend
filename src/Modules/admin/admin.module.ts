import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Generation } from "../../Entities/generation.entity";
import { PaymentTransaction } from "../../Entities/payment-transaction";
import { Scene } from "../../Entities/scene.entity";
import { User } from "../../Entities/user.entity";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Generation, Scene, PaymentTransaction]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}