import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPositive } from 'class-validator';

export class SimpleTransactionDto {
  @IsPositive()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The amount to deposit into the account',
    example: 100,
    required: true,
  })
  amount: number;

  @ApiProperty({
    description: 'The account ID to deposit into',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsNotEmpty()
  toAccountId: string;

  @ApiProperty({
    description: 'The description of the deposit transaction',
    example: 'Deposit for savings',
    required: false,
  })
  description?: string;
}
