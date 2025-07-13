import { ApiProperty } from '@nestjs/swagger';

export class AccountResponseDto {
  @ApiProperty({
    description: 'Unique account identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID who owns the account',
    example: 1,
  })
  userId: number;

  @ApiProperty({
    description: 'Type of account',
    enum: ['current_account', 'investment_account'],
    example: 'current_account',
  })
  type: string;

  @ApiProperty({
    description: 'Current account balance',
    example: 1500.75,
  })
  balance: number;

  @ApiProperty({
    description: 'Whether the account is active',
    example: true,
  })
  active: boolean;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2025-07-13T18:15:45.123Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Account last update timestamp',
    example: '2025-07-13T18:15:45.123Z',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'Whether the account has pending transactions',
    example: false,
  })
  pendingTransaction: boolean;
}

export class TransactionResponseDto {
  @ApiProperty({
    description: 'Unique transaction identifier',
    example: '456e7890-e12b-34c5-d678-901234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Source account ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  fromAccountId: string;

  @ApiProperty({
    description: 'Destination account ID (null for deposits/withdrawals)',
    example: '789e0123-e45f-67g8-h901-234567890123',
    nullable: true,
  })
  toAccountId: string | null;

  @ApiProperty({
    description: 'Transaction amount',
    example: 250.0,
  })
  amount: number;

  @ApiProperty({
    description: 'Transaction type',
    enum: ['deposit', 'withdraw', 'transfer'],
    example: 'transfer',
  })
  type: string;

  @ApiProperty({
    description: 'Transaction description',
    example: 'Monthly salary transfer',
  })
  description: string;

  @ApiProperty({
    description: 'Transaction creation timestamp',
    example: '2025-07-13T18:15:45.123Z',
  })
  createdAt: string;
}
