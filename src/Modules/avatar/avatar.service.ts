import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Avatar } from '../../Entities/avatar.entity';
import { User } from '../../Entities/user.entity';
import { CreateAvatarDto } from './dto/create-avatar.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { SubscriptionService } from '../subscription/subscription.service';
import { SubscriptionPlan } from '../subscription/dto/create-subscription.dto';
import { TokenBalanceService } from '../token-balance/token-balance.service';

@Injectable()
export class AvatarService {
  constructor(
    @InjectRepository(Avatar)
    private avatarRepository: Repository<Avatar>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
    private subscriptionService: SubscriptionService,
    private tokenBalanceService: TokenBalanceService,
  ) { }

  async create(userId: string, dto: CreateAvatarDto): Promise<Avatar> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    const existingAvatar = await this.avatarRepository.findOne({
      where: { user: { id: userId } }
    });

    // Если это ПЕРВЫЙ аватар пользователя
    if (!existingAvatar && user.generatedAvatar === false) {
      // 1. Создаем подписку на 7 дней
      const now = new Date();
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(now.getDate() + 7);

      await this.subscriptionService.create(userId, {
        plan: SubscriptionPlan.BASIC,
        startsAt: now,
        endsAt: sevenDaysLater,
      });

      // 2. Пополняем баланс на 20 токенов (Welcome Bonus)
      await this.tokenBalanceService.addTokens(
        userId,
        20,
        'Бонус за создание первого аватара'
      );
    }

    // 3. Создаем сам аватар
    const avatar = this.avatarRepository.create({
      user,
      name: dto.name,
      gender: dto.gender,
      imagesURL: dto.imagesURL,
    });

    return await this.avatarRepository.save(avatar);
  }


  findAll(): Promise<Avatar[]> {
    return this.avatarRepository.find({
      relations: ['user'],
    });
  }

  findByUser(userId: string): Promise<Avatar | null> {
    return this.avatarRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async update(id: string, dto: UpdateAvatarDto): Promise<Avatar | null> {
    await this.avatarRepository.update(id, dto);
    return this.avatarRepository.findOne({ where: { id } });
  }

  async addImgUrl(userId: string, newImageUrl: string): Promise<Avatar> {
    const avatar = await this.avatarRepository.findOne({
      where: { user: { id: userId } }
    });

    if (!avatar) {
      throw new NotFoundException(`Avatar for user ${userId} not found`);
    }
    avatar.imagesURL = [...(avatar.imagesURL || []), newImageUrl];
    return await this.avatarRepository.save(avatar);
  }

  async remove(id: string): Promise<void> {
    await this.avatarRepository.delete(id);
  }

  async changeActiveAvatar(userId: string, newActiveUrl: string): Promise<Avatar> {
    const avatar = await this.avatarRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!avatar) {
      throw new NotFoundException('Аватар для данного пользователя не найден');
    }

    const hasImage = avatar.imagesURL.includes(newActiveUrl);

    if (!hasImage) {
      throw new BadRequestException('Данное изображение не найдено в списке загруженных аватаров');
    }

    avatar.activeAvatar = newActiveUrl;
    return await this.avatarRepository.save(avatar);
  }

}
