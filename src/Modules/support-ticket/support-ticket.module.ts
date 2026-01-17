import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportTicket } from '../../Entities/support-ticket.entity';
import { User } from '../../Entities/user.entity';
import { SupportTicketService } from './support-ticket.service';
import { SupportTicketController } from './support-ticket.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SupportTicket, User])],
  providers: [SupportTicketService],
  controllers: [SupportTicketController],
})
export class SupportTicketModule {}
