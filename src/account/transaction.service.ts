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
          fromAccountId: null,
          toAccountId: accountId,
          type: 'internal',
          amount,
          description: 'Deposit',
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
          toAccountId: null,
          type: 'internal',
          amount,
          description: 'Withdrawal',
        },
      });

      return transaction;
    });
  }

  async transfer(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    describetion: string,
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

      const isExternalTransfer = fromAccount.userId !== toAccount.userId;
      const isFromInvestment = fromAccount.type === 'investment_account';
      const isToCurrent = toAccount.type === 'current_account';

      // Rule: External transfers only between current accounts
      if (
        isExternalTransfer &&
        (fromAccount.type !== 'current_account' || !isToCurrent)
      ) {
        throw new TransactionException(
          'INVALID_ACCOUNT_TYPE',
          'External transfers are only allowed between current accounts',
        );
      }

      // Rule: Investment account can only transfer to a current account (internal transfer)
      if (!isExternalTransfer && isFromInvestment && !isToCurrent) {
        throw new TransactionException(
          'INVALID_ACCOUNT_TYPE',
          'Investment account can only transfer to a current account',
        );
      }

      if (isFromInvestment && fromAccount.pendingTransaction) {
        throw new TransactionException(
          'PENDING_TRANSACTION',
          'Cannot transfer from an account with a pending transaction',
        );
      }

      let descreaseAmount = amount;
      if (isExternalTransfer) {
        // 0.5% fee
        const fee = amount * 0.005;
        descreaseAmount += fee;
      }
      if (fromAccount.balance < descreaseAmount) {
        throw new TransactionException(
          'INSUFFICIENT_FUNDS',
          'Insufficient funds for transfer',
        );
      }

      await prisma.account.update({
        where: { id: fromAccountId },
        data: { balance: { decrement: descreaseAmount } },
      });
      await prisma.account.update({
        where: { id: toAccountId },
        data: { balance: { increment: amount } },
      });

      const transaction = await prisma.transaction.create({
        data: {
          fromAccountId,
          toAccountId,
          type: isExternalTransfer ? 'external' : 'internal',
          amount,
          description: describetion,
        },
      });

      return transaction;
    });
  }
}
