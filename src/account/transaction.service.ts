import { PrismaService } from '@database/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@prisma/client';
import { TransactionException } from '@src/exception/transaction.exception';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async deposit(accountId: string, amount: number): Promise<Transaction> {
    if (amount <= 0) {
      throw new TransactionException(
        'INVALID_AMOUNT',
        'Amount must be greater than zero',
      );
    }

    const account = await this.prismaService.account.findUnique({
      where: { id: accountId },
    });
    if (!account) {
      throw new TransactionException('ACCOUNT_NOT_FOUND', 'Account not found');
    }
    if (account.type === 'investment_account') {
      throw new TransactionException(
        'INVALID_ACCOUNT_TYPE',
        'Operation not allowed on investment accounts',
      );
    }

    return this.prismaService.$transaction(async (prisma) => {
      await prisma.account.update({
        where: { id: accountId },
        data: { balance: { increment: amount } },
      });

      const transaction = await prisma.transaction.create({
        data: {
          toAccountId: accountId,
          type: 'internal',
          amount,
        },
      });

      return transaction;
    });
  }

  async withdraw(accountId: string, amount: number): Promise<Transaction> {
    if (amount <= 0) {
      throw new TransactionException(
        'INVALID_AMOUNT',
        'Amount must be greater than zero',
      );
    }

    return this.prismaService.$transaction(async (prisma) => {
      const account = await prisma.account.findUnique({
        where: { id: accountId },
      });
      if (!account) {
        throw new TransactionException(
          'ACCOUNT_NOT_FOUND',
          'Account not found',
        );
      }
      if (account.type === 'investment_account') {
        throw new TransactionException(
          'INVALID_ACCOUNT_TYPE',
          'Operation not allowed on investment accounts',
        );
      }
      if (account.balance < amount) {
        throw new TransactionException(
          'INSUFFICIENT_FUNDS',
          'Insufficient funds for transfer',
        );
      }

      await prisma.account.update({
        where: { id: accountId },
        data: { balance: { decrement: amount } },
      });

      const transaction = await prisma.transaction.create({
        data: {
          fromAccountId: accountId,
          type: 'internal',
          amount,
        },
      });

      return transaction;
    });
  }

  async transfer(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
  ): Promise<Transaction> {
    if (amount <= 0) {
      throw new TransactionException(
        'INVALID_AMOUNT',
        'Amount must be greater than zero',
      );
    }
    if (fromAccountId === toAccountId) {
      throw new TransactionException(
        'SAME_ACCOUNT_TRANSFER',
        'Cannot transfer to the same account',
      );
    }

    return this.prismaService.$transaction(async (prisma) => {
      const toAccount = await prisma.account.findUnique({
        where: { id: toAccountId },
      });
      if (!toAccount) {
        throw new TransactionException(
          'ACCOUNT_NOT_FOUND',
          'Destination account not found',
        );
      }

      const fromAccount = await prisma.account.findUnique({
        where: { id: fromAccountId },
      });
      if (!fromAccount) {
        throw new TransactionException(
          'ACCOUNT_NOT_FOUND',
          'Source account not found',
        );
      }
      if (fromAccount.balance < amount) {
        throw new TransactionException(
          'INSUFFICIENT_FUNDS',
          'Insufficient funds for transfer',
        );
      }

      await prisma.account.update({
        where: { id: fromAccountId },
        data: { balance: { decrement: amount } },
      });
      await prisma.account.update({
        where: { id: toAccountId },
        data: { balance: { increment: amount } },
      });
      const transaction = await prisma.transaction.create({
        data: {
          fromAccountId,
          toAccountId,
          type: 'internal',
          amount,
        },
      });

      return transaction;
    });
  }
}
