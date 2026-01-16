import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  plan: string;

  @Column()
  startsAt: Date;

  @Column()
  endsAt: Date;

  @Column({ default: true })
  isActive: boolean;
}
