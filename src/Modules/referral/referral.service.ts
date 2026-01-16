import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral } from 'src/Entities/referral.entity';
import { User } from 'src/Entities/user.entity';
import { CreateReferralDto } from './dto/create-referral.dto';

@Injectable()
export class ReferralService {
  constructor(
    @InjectRepository(Referral)
    private referralRepo: Repository<Referral>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(dto: CreateReferralDto) {
    if (dto.inviterId === dto.invitedId) {
      throw new BadRequestException('Inviter and invited cannot be the same user');
    }

    const inviter = await this.userRepo.findOne({ where: { id: dto.inviterId } });
    const invited = await this.userRepo.findOne({ where: { id: dto.invitedId } });

    if (!inviter || !invited) {
      throw new NotFoundException('User not found');
    }

    const exists = await this.referralRepo.findOne({
      where: { invited: { id: invited.id } },
    });

    if (exists) {
      throw new BadRequestException('User already has an inviter');
    }

    const referral = this.referralRepo.create({
      inviter,
      invited,
    });

    return this.referralRepo.save(referral);
  }

  findAll() {
    return this.referralRepo.find({
      relations: ['inviter', 'invited'],
      order: { createdAt: 'DESC' },
    });
  }

  findByInviter(inviterId: string) {
    return this.referralRepo.find({
      where: { inviter: { id: inviterId } },
      relations: ['invited'],
    });
  }
}
