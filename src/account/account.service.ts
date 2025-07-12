import { PrismaService } from '@database/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { Account, Transaction } from '@prisma/client';
import { CreateAccountDto } from './dto/create-account.dto';
import { TransactionDto } from './dto/simple-transaction.dto';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async create(createAccountDto: CreateAccountDto): Promise<Account | null> {
    try {
      const account = await this.prismaService.account.create({
        data: createAccountDto,
      });

      return account;
    } catch (error) {
      this.logger.warn(`Failed to create account: ${error}`);
      return null;
    }
  }

  async findOne(id: string): Promise<Account | null> {
    const account = await this.prismaService.account.findUnique({
      where: { id },
    });
    if (!account) {
      return null;
    }

    return account;
  }

  async update(id: string, accountActive: boolean): Promise<Account | null> {
    if (!(await this.findOne(id))) {
      return null;
    }

    try {
      const account = this.prismaService.account.update({
        where: { id },
        data: { active: accountActive },
      });
      return account;
    } catch (error) {
      this.logger.warn(`Failed to activate account: ${error}`);
      return null;
    }
  }

  async deposit(dto: TransactionDto): Promise<Transaction | Error> {
    return this.prismaService.$transaction(async (prisma) => {
      const account = await prisma.account.findUnique({
        where: { id: dto.toAccountId },
      });
      if (!account) {
        throw new Error('Account not found', { cause: 'ACCOUNT_NOT_FOUND' });
      }

      const update = await prisma.account.update({
        where: { id: dto.toAccountId },
        data: { balance: { increment: dto.amount } },
      });
      if (!update) {
        throw new Error('Account update failed', {
          cause: 'ACCOUNT_UPDATE_FAILED',
        });
      }

      const transaction = await prisma.transaction.create({
        data: {
          amount: dto.amount,
          toAccountId: dto.toAccountId,
          description: dto.description,
        } as Transaction,
      });
      if (!transaction) {
        throw new Error('Transaction creation failed', {
          cause: 'TRANSACTION_FAILED',
        });
      }

      return transaction;
    });
  }

  async withdraw(dto: TransactionDto): Promise<Transaction | Error> {
    return this.prismaService.$transaction(async (prisma) => {
      const account = await prisma.account.findUnique({
        where: { id: dto.fromAccountId },
      });
      if (!account) {
        throw new Error('Account not found', { cause: 'ACCOUNT_NOT_FOUND' });
      }

      if (account.balance < dto.amount) {
        throw new Error('Insufficient funds', { cause: 'INSUFFICIENT_FUNDS' });
      }

      const update = await prisma.account.update({
        where: { id: dto.fromAccountId },
        data: { balance: { decrement: dto.amount } },
      });
      if (!update) {
        throw new Error('Account update failed', {
          cause: 'ACCOUNT_UPDATE_FAILED',
        });
      }

      const transaction = await prisma.transaction.create({
        data: {
          amount: dto.amount,
          fromAccountId: dto.fromAccountId,
          description: dto.description,
        } as Transaction,
      });
      if (!transaction) {
        throw new Error('Transaction creation failed', {
          cause: 'TRANSACTION_FAILED',
        });
      }

      return transaction;
    });
  }
}
