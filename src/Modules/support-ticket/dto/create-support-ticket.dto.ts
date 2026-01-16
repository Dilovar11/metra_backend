import { ApiProperty } from '@nestjs/swagger';

export class CreateSupportTicketDto {
  @ApiProperty({ example: 'user-uuid' })
  userId: string;

  @ApiProperty({ example: 'У меня не работает генерация' })
  message: string;
}
