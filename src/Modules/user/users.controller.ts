import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../../Entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Получить всех пользователей' })
  @ApiResponse({ status: 200, description: 'Список пользователей', type: [User] })
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  @ApiParam({ name: 'id', description: 'ID пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь найден', type: User })
  findOne(@Param('id') id: string): Promise<User | null> {
    return this.usersService.findOne(id);
  }

  @Get('telegram/:telegramId')
  @ApiOperation({ summary: 'Получить пользователя по Telegram ID' })
  @ApiParam({ name: 'telegramId', description: 'Telegram ID пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь найден', type: User })
  findByTelegramId(@Param('telegramId') telegramId: string): Promise<User | null> {
    return this.usersService.findByTelegramId(telegramId);
  }

  @Post()
  @ApiOperation({ summary: 'Создать нового пользователя' })
  @ApiBody({ type: User })
  @ApiResponse({ status: 201, description: 'Пользователь создан', type: User })
  create(@Body() userData: CreateUserDto): Promise<User> {
    return this.usersService.create(userData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить пользователя по ID' })
  @ApiParam({ name: 'id', description: 'ID пользователя' })
  @ApiBody({ type: User })
  @ApiResponse({ status: 200, description: 'Пользователь обновлён', type: User })
  update(@Param('id') id: string, @Body() updateData: CreateUserDto): Promise<User | null> {
    return this.usersService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить пользователя по ID' })
  @ApiParam({ name: 'id', description: 'ID пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь удалён' })
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
