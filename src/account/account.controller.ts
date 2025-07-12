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
import { SimpleTransactionDto } from './dto/simple-transaction.dto';

@Controller('account')
export class AccountController {
  private readonly logger = new Logger(AccountController.name);

  constructor(private readonly accountService: AccountService) {}

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
    @Body(ValidationPipe) dto: SimpleTransactionDto,
  ): Promise<Transaction | HttpException> {
    const result = await this.accountService.deposit(dto);
    if (result instanceof Error) {
      throw new BadRequestException(result.message, String(result.cause));
    }

    return result;
  }
}
