import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
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
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Account, Transaction } from '@prisma/client';
import { GetUser } from '@src/auth/decorators/get-user.decorator';
import { LoggedInUser } from '@src/auth/dto/logged-in-user.dto';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { DepositDto, TransactionDto, WithdrawDto } from './dto/transaction.dto';
import { TransactionService } from './transaction.service';

@UseGuards(JwtAuthGuard)
@Controller('account')
@ApiBearerAuth()
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

  @Get('get')
  async findByUser(
    @GetUser() user: LoggedInUser,
  ): Promise<Account[] | HttpException> {
    const account = await this.accountService.findByUser(user.id);
    if (!account) {
      return new NotFoundException('Account not found');
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
    @GetUser() user: LoggedInUser,
    @Body(ValidationPipe) dto: DepositDto,
  ): Promise<Transaction | HttpException> {
    const accounts = await this.accountService.findByUser(user.id);
    if (!accounts || accounts.length === 0) {
      return new NotFoundException('No accounts found for user');
    }
    const currentAccount = accounts.find(
      (account: Account) => account.type === 'current_account',
    );
    if (!currentAccount) {
      return new NotFoundException('Current account not found');
    }

    try {
      const result = await this.transactionService.deposit(
        currentAccount.id,
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
    @GetUser() user: LoggedInUser,
    @Body(ValidationPipe) dto: WithdrawDto,
  ): Promise<Transaction | HttpException> {
    const accounts = await this.accountService.findByUser(user.id);
    if (!accounts || accounts.length === 0) {
      return new NotFoundException('No accounts found for user');
    }
    const currentAccount = accounts.find(
      (account: Account) => account.type === 'current_account',
    );
    if (!currentAccount) {
      return new NotFoundException('Current account not found');
    }

    try {
      const result = await this.transactionService.withdraw(
        currentAccount.id,
        dto.amount,
      );

      return result;
    } catch (error: any) {
      this.logger.error('Withdraw failed', error);
      return new BadRequestException('Withdraw failed');
    }
  }

  @Post('transfer')
  async transfer(
    @GetUser() user: LoggedInUser,
    @Body(ValidationPipe) dto: TransactionDto,
  ): Promise<Transaction | HttpException> {
    const accounts = await this.accountService.findByUser(user.id);
    if (!accounts || accounts.length === 0) {
      return new NotFoundException('No accounts found for user');
    }
    const account = accounts.find(
      (account: Account) => account.type === dto.fromAccountType,
    );
    if (!account) {
      return new NotFoundException('Current account not found');
    }

    try {
      const result = await this.transactionService.transfer(
        account.id,
        dto.toAccountId,
        dto.amount,
        dto.description || '',
      );

      return result;
    } catch (error: any) {
      this.logger.error('Transfer failed', error);
      return new BadRequestException('Transfer failed');
    }
  }
}
