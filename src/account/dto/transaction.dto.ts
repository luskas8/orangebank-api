import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

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
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  toAccountId: string;

  @ApiProperty({
    description: 'The type of the account from which the transaction is made',
    example: 'current_account',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(['current_account', 'investment_account'])
  fromAccountType: 'current_account' | 'investment_account';

  @ApiProperty({
    description: 'The description of the deposit transaction',
    example: 'Deposit for savings',
    required: false,
  })
  @IsOptional()
  description?: string;
}

export class WithdrawDto extends OmitType(TransactionDto, [
  'toAccountId',
  'fromAccountType',
]) {}

export class DepositDto extends OmitType(TransactionDto, [
  'toAccountId',
  'fromAccountType',
]) {}
