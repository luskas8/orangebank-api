import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  BadRequestException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { Account } from '@prisma/client';

@Controller('account')
export class AccountController {
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
}
