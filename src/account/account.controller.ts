import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { Account, Transaction } from '@prisma/client';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { TransactionDto } from './dto/simple-transaction.dto';
import { TransactionService } from './transaction.service';

@Controller('account')
export class AccountController {
  private readonly logger = new Logger(AccountController.name);

  constructor(
    private readonly accountService: AccountService,
    private readonly transactionService: TransactionService,
  ) {}

  @Post('create')
  async create(
    @Body(ValidationPipe) createAccountDto: CreateAccountDto,
  ): Promise<Account | HttpException> {
    const account = await this.accountService.create(createAccountDto);
    if (!account) {
      return new BadRequestException('Account creation failed');
    }

    return account;
  }

  @Get('get/:id')
  async findOne(@Param('id') id: string): Promise<Account | HttpException> {
    const account = await this.accountService.findOne(id);
    if (!account) {
      return new NotFoundException('Account not found');
    }

    return account;
  }

  @Patch('activate/:id')
  async activate(@Param('id') id: string): Promise<Account | HttpException> {
    const account = await this.accountService.update(id, true);
    if (!account) {
      return new BadRequestException('Account activation failed');
    }

    return account;
  }

  @Delete('deativate/:id')
  async deactivate(@Param('id') id: string): Promise<Account | HttpException> {
    const account = await this.accountService.update(id, false);
    if (!account) {
      return new BadRequestException('Account deactivation failed');
    }

    return account;
  }

  @Post('deposit')
  async deposit(
    @Body(ValidationPipe) dto: TransactionDto,
  ): Promise<Transaction | HttpException> {
    if (!dto.toAccountId) {
      return new BadRequestException('toAccountId is required');
    }

    try {
      const result = await this.transactionService.deposit(
        dto.toAccountId,
        dto.amount,
      );

      return result;
    } catch (error: any) {
      this.logger.error('Deposit failed', error);
      return new BadRequestException('Deposit failed');
    }
  }

  @Post('withdraw')
  async withdraw(
    @Body(ValidationPipe) dto: TransactionDto,
  ): Promise<Transaction | HttpException> {
    if (!dto.fromAccountId) {
      return new BadRequestException('fromAccountId is required');
    }

    try {
      const result = await this.transactionService.withdraw(
        dto.fromAccountId,
        dto.amount,
      );

      return result;
    } catch (error: any) {
      this.logger.error('Withdraw failed', error);
      return new BadRequestException('Withdraw failed');
    }
  }
}
