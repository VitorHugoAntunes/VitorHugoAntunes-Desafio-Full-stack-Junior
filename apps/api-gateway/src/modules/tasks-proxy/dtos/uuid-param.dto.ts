import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UuidParamDto {
  @ApiProperty({
    description: 'Resource UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  id: string;
}