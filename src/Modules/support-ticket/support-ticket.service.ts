import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket } from '../../Entities/support-ticket.entity';
import { User } from '../../Entities/user.entity';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';

@Injectable()
export class SupportTicketService {
  constructor(
    @InjectRepository(SupportTicket)
    private ticketRepo: Repository<SupportTicket>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(dto: CreateSupportTicketDto) {
    const user = await this.userRepo.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    const ticket = this.ticketRepo.create({
      user,
      message: dto.message,
      status: 'open',
    });

    return this.ticketRepo.save(ticket);
  }

  findAll() {
    return this.ticketRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  findByUser(userId: string) {
    return this.ticketRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, dto: UpdateSupportTicketDto) {
    const ticket = await this.ticketRepo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    ticket.status = dto.status;
    return this.ticketRepo.save(ticket);
  }
}
