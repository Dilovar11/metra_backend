import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  inviter: User;

  @ManyToOne(() => User)
  invited: User;

  @CreateDateColumn()
  createdAt: Date;
}
