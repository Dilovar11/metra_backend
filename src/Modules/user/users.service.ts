import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../Entities/user.entity';
import { CreateUserDto } from './dto/create.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Получить всех пользователей
  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  // Найти пользователя по id
  findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  // Найти пользователя по telegramId
  findByTelegramId(telegramId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { telegramId } });
  }

  // Создать пользователя
  create(userData: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  // Обновить пользователя
  async update(id: string, updateData: CreateUserDto): Promise<User | null> {
    await this.usersRepository.update(id, updateData);
    return this.findOne(id);
  }

  // Удалить пользователя
  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
