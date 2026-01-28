import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../Entities/user.entity';
import { Referral } from '../../Entities/referral.entity';
import { ReferralCode } from '../../Entities/referral_codes';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Referral) private referralRepo: Repository<Referral>,
    @InjectRepository(ReferralCode) private codeRepo: Repository<ReferralCode>,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Проверяем, не зарегистрирован ли уже пользователь
    const existingUser = await this.userRepo.findOne({ where: { telegramId: dto.telegramId } });
    if (existingUser) throw new BadRequestException('Пользователь уже существует');

    // 2. Создаем нового пользователя
    const newUser = this.userRepo.create({
      telegramId: dto.telegramId,
      username: dto.username,
      firstName: dto.firstName,
      lastName: dto.lastName
    });
    const savedUser = await this.userRepo.save(newUser);

    // 3. Если передан реферальный код — связываем
    if (dto.refCode) {
      await this.linkReferral(savedUser, dto.refCode);
    }

    return savedUser;
  }


  private async linkReferral(newUser: User, code: string) {
    // Ищем код и его владельца
    const refCodeRecord = await this.codeRepo.findOne({ 
      where: { code, isActive: true },
      relations: ['owner'] 
    });

    if (refCodeRecord && refCodeRecord.owner.id !== newUser.id) {
      // Создаем запись в таблице рефералов
      const referral = this.referralRepo.create({
        inviter: refCodeRecord.owner,
        invited: newUser
      });
      await this.referralRepo.save(referral);
      
      console.log(`User ${newUser.id} linked to inviter ${refCodeRecord.owner.id}`);
    }
  }
}