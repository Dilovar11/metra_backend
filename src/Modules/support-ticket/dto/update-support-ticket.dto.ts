import { ApiProperty } from '@nestjs/swagger';

export class UpdateSupportTicketDto {
  @ApiProperty({ enum: ['open', 'closed'] })
  status: 'open' | 'closed';
}
