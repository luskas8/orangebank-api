import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPositive } from 'class-validator';

export class TransactionDto {
  @IsPositive()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The amount to be deposited',
    example: 100,
    required: true,
  })
  amount: number;

  @ApiProperty({
    description: 'The account ID the transaction is to',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  toAccountId?: string;

  @ApiProperty({
    description: 'The account ID the transaction is from',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  fromAccountId?: string;

  @ApiProperty({
    description: 'The description of the deposit transaction',
    example: 'Deposit for savings',
    required: false,
  })
  description?: string;
}
