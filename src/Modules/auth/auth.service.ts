import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../Entities/user.entity';
import { Referral } from '../../Entities/referral.entity';
import { ReferralCode } from '../../Entities/referral_codes';
import { RegisterDto } from './dto/register.dto';
import { ReferralService } from '../referral/referral.service';
import { TokenBalanceService } from '../token-balance/token-balance.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Referral) private referralRepo: Repository<Referral>,
    @InjectRepository(ReferralCode) private codeRepo: Repository<ReferralCode>,
    private referralService: ReferralService,
    private tokenBalanceService: TokenBalanceService
  ) { }

  async register(dto: RegisterDto) {
    const existingUser = await this.userRepo.findOne({ where: { telegramId: dto.telegramId } });
    if (existingUser) throw new BadRequestException('Пользователь уже существует');

    const newUser = this.userRepo.create({
      id: dto.telegramId,
      telegramId: dto.telegramId,
      username: dto.username,
      firstName: dto.firstName,
      lastName: dto.lastName,
      generatedAvatar: false
    });

    const savedUser = await this.userRepo.save(newUser);

    // 2. СОЗДАЕМ БАЛАНС сразу после регистрации
    try {
      await this.tokenBalanceService.create(
        { balance: 0 },
        savedUser.id
      );
      console.log(`Token balance created for user ${savedUser.id}`);
    } catch (balanceError) {
      console.error(`Failed to create balance for ${savedUser.id}:`, balanceError.message);
    }
    
    try {
      if (dto.refCode) {
        await this.referralService.trackClick(dto.refCode, savedUser.telegramId);
        await this.linkReferral(savedUser, dto.refCode);
      }
      await this.referralService.getMyLink(savedUser.id);
    } catch (e) {
      console.error(`Referral flow error for ${savedUser.id}:`, e.message);
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