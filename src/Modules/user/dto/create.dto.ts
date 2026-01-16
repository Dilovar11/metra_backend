import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: '123456789' })
  telegramId: string;

  @ApiProperty({ example: 'johndoe', required: false })
  username?: string;

  @ApiProperty({ example: 'John', required: false })
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  lastName?: string;

  @ApiProperty({ example: false, required: false })
  isBlocked?: boolean;
}
