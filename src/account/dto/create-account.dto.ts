import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  ValidateIf,
} from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({
    description: 'The account type',
    enum: ['current_account', 'investment_account'],
    example: 'current_account',
    required: true,
  })
  @ValidateIf((o: CreateAccountDto) => o.type !== undefined)
  @IsEnum(['current_account', 'investment_account'])
  @IsNotEmpty()
  type: 'current_account' | 'investment_account';

  @ApiProperty({
    description: 'The initial balance of the account',
    example: 0,
    required: false,
  })
  @ValidateIf((o: CreateAccountDto) => o.balance !== undefined)
  @IsNumber()
  @IsPositive()
  balance: number = 0;

  @ApiProperty({
    description: 'The account active status',
    default: true,
  })
  active: boolean = true;

  @ApiProperty({
    description: 'The user ID associated with the account',
    example: 1,
    required: true,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  userId: number;
}
