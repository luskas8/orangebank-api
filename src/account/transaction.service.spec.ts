import { PrismaService } from '@database/prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, Transaction } from '@prisma/client';
import { TransactionException } from '@src/exception/transaction.exception';
import { TransactionService } from './transaction.service';

const mockAccount: Account = {
  id: 'account-1',
  userId: 1,
  active: true,
  balance: 1000,
  type: 'current_account',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  pendingTransaction: false,
};

const mockInvestmentAccount: Account = {
  id: 'investment-account-1',
  userId: 1,
  active: true,
  balance: 5000,
  type: 'investment_account',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  pendingTransaction: false,
};

const mockTransaction: Transaction = {
  id: 'transaction-1',
  fromAccountId: null,
  toAccountId: 'account-1',
  amount: 100,
  type: 'internal',
  description: null,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

describe('TransactionService', () => {
  let service: TransactionService;
  let prismaService: any;

  beforeEach(async () => {
    const mockPrismaService = {
      account: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      transaction: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deposit', () => {
    it('should successfully deposit money to a current account', async () => {
      // GIVEN
      const accountId = 'account-1';
      const amount = 100;
      const expectedTransaction = { ...mockTransaction, amount };

      prismaService.account.findUnique.mockResolvedValue(mockAccount);
      prismaService.$transaction.mockImplementation(
        async (callback: (prisma: any) => Promise<Transaction>) => {
          const mockPrisma = {
            account: { update: jest.fn() },
            transaction: {
              create: jest.fn().mockResolvedValue(expectedTransaction),
            },
          };
          return callback(mockPrisma);
        },
      );

      // WHEN
      const result = await service.deposit(accountId, amount);

      // THEN
      expect(result).toEqual(expectedTransaction);
      expect(prismaService.account.findUnique).toHaveBeenCalledWith({
        where: { id: accountId },
      });
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw TransactionException when amount is zero', async () => {
      // GIVEN
      const accountId = 'account-1';
      const amount = 0;

      // WHEN & THEN
      await expect(service.deposit(accountId, amount)).rejects.toThrow(
        new TransactionException(
          'INVALID_AMOUNT',
          'Amount must be greater than zero',
        ),
      );
    });

    it('should throw TransactionException when amount is negative', async () => {
      // GIVEN
      const accountId = 'account-1';
      const amount = -100;

      // WHEN & THEN
      await expect(service.deposit(accountId, amount)).rejects.toThrow(
        new TransactionException(
          'INVALID_AMOUNT',
          'Amount must be greater than zero',
        ),
      );
    });

    it('should throw TransactionException when account not found', async () => {
      // GIVEN
      const accountId = 'non-existent-account';
      const amount = 100;

      prismaService.account.findUnique.mockResolvedValue(null);

      // WHEN & THEN
      await expect(service.deposit(accountId, amount)).rejects.toThrow(
        new TransactionException('ACCOUNT_NOT_FOUND', 'Account not found'),
      );
    });

    it('should throw TransactionException when trying to deposit to investment account', async () => {
      // GIVEN
      const accountId = 'investment-account-1';
      const amount = 100;

      prismaService.account.findUnique.mockResolvedValue(mockInvestmentAccount);

      // WHEN & THEN
      await expect(service.deposit(accountId, amount)).rejects.toThrow(
        new TransactionException(
          'INVALID_ACCOUNT_TYPE',
          'Operation not allowed on investment accounts',
        ),
      );
    });
  });

  describe('withdraw', () => {
    it('should successfully withdraw money from a current account', async () => {
      // GIVEN
      const accountId = 'account-1';
      const amount = 100;
      const expectedTransaction = {
        ...mockTransaction,
        fromAccountId: accountId,
        toAccountId: null,
        amount,
      };

      prismaService.$transaction.mockImplementation(
        async (callback: (prisma: any) => Promise<Transaction>) => {
          const mockPrisma = {
            account: {
              findUnique: jest.fn().mockResolvedValue(mockAccount),
              update: jest.fn(),
            },
            transaction: {
              create: jest.fn().mockResolvedValue(expectedTransaction),
            },
          };
          return callback(mockPrisma);
        },
      );

      // WHEN
      const result = await service.withdraw(accountId, amount);

      // THEN
      expect(result).toEqual(expectedTransaction);
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw TransactionException when amount is zero', async () => {
      // GIVEN
      const accountId = 'account-1';
      const amount = 0;

      // WHEN & THEN
      await expect(service.withdraw(accountId, amount)).rejects.toThrow(
        new TransactionException(
          'INVALID_AMOUNT',
          'Amount must be greater than zero',
        ),
      );
    });

    it('should throw TransactionException when amount is negative', async () => {
      // GIVEN
      const accountId = 'account-1';
      const amount = -100;

      // WHEN & THEN
      await expect(service.withdraw(accountId, amount)).rejects.toThrow(
        new TransactionException(
          'INVALID_AMOUNT',
          'Amount must be greater than zero',
        ),
      );
    });

    it('should throw TransactionException when account not found', async () => {
      // GIVEN
      const accountId = 'non-existent-account';
      const amount = 100;

      prismaService.$transaction.mockImplementation(
        async (callback: (prisma: any) => Promise<Transaction>) => {
          const mockPrisma = {
            account: {
              findUnique: jest.fn().mockResolvedValue(null),
              update: jest.fn(),
            },
            transaction: { create: jest.fn() },
          };
          return callback(mockPrisma);
        },
      );

      // WHEN & THEN
      await expect(service.withdraw(accountId, amount)).rejects.toThrow(
        new TransactionException('ACCOUNT_NOT_FOUND', 'Account not found'),
      );
    });

    it('should throw TransactionException when trying to withdraw from investment account', async () => {
      // GIVEN
      const accountId = 'investment-account-1';
      const amount = 100;

      prismaService.$transaction.mockImplementation(
        async (callback: (prisma: any) => Promise<Transaction>) => {
          const mockPrisma = {
            account: {
              findUnique: jest.fn().mockResolvedValue(mockInvestmentAccount),
              update: jest.fn(),
            },
            transaction: { create: jest.fn() },
          };
          return callback(mockPrisma);
        },
      );

      // WHEN & THEN
      await expect(service.withdraw(accountId, amount)).rejects.toThrow(
        new TransactionException(
          'INVALID_ACCOUNT_TYPE',
          'Operation not allowed on investment accounts',
        ),
      );
    });

    it('should throw TransactionException when insufficient funds', async () => {
      // GIVEN
      const accountId = 'account-1';
      const amount = 2000; // More than account balance (1000)

      prismaService.$transaction.mockImplementation(
        async (callback: (prisma: any) => Promise<Transaction>) => {
          const mockPrisma = {
            account: {
              findUnique: jest.fn().mockResolvedValue(mockAccount),
              update: jest.fn(),
            },
            transaction: { create: jest.fn() },
          };
          return callback(mockPrisma);
        },
      );

      // WHEN & THEN
      await expect(service.withdraw(accountId, amount)).rejects.toThrow(
        new TransactionException(
          'INSUFFICIENT_FUNDS',
          'Insufficient funds for transfer',
        ),
      );
    });
  });

  describe('transfer', () => {
    const fromAccountId = 'account-1';
    const toAccountId = 'account-2';
    const toAccount = { ...mockAccount, id: toAccountId };

    it('should successfully transfer money between accounts', async () => {
      // GIVEN
      const amount = 100;
      const expectedTransaction = {
        ...mockTransaction,
        fromAccountId,
        toAccountId,
        amount,
      };

      prismaService.$transaction.mockImplementation(
        async (callback: (prisma: any) => Promise<Transaction>) => {
          const mockPrisma = {
            account: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce(toAccount) // First call for toAccount
                .mockResolvedValueOnce(mockAccount), // Second call for fromAccount
              update: jest.fn(),
            },
            transaction: {
              create: jest.fn().mockResolvedValue(expectedTransaction),
            },
          };
          return callback(mockPrisma);
        },
      );

      // WHEN
      const result = await service.transfer(
        fromAccountId,
        toAccountId,
        amount,
        'Test transfer',
      );

      // THEN
      expect(result).toEqual(expectedTransaction);
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw TransactionException when amount is zero', async () => {
      // GIVEN
      const amount = 0;

      // WHEN & THEN
      await expect(
        service.transfer(fromAccountId, toAccountId, amount, 'Test transfer'),
      ).rejects.toThrow(
        new TransactionException(
          'INVALID_AMOUNT',
          'Amount must be greater than zero',
        ),
      );
    });

    it('should throw TransactionException when amount is negative', async () => {
      // GIVEN
      const amount = -100;

      // WHEN & THEN
      await expect(
        service.transfer(fromAccountId, toAccountId, amount, 'Test transfer'),
      ).rejects.toThrow(
        new TransactionException(
          'INVALID_AMOUNT',
          'Amount must be greater than zero',
        ),
      );
    });

    it('should throw TransactionException when transferring to same account', async () => {
      // GIVEN
      const amount = 100;
      const sameAccountId = 'account-1';

      // WHEN & THEN
      await expect(
        service.transfer(sameAccountId, sameAccountId, amount, 'Test transfer'),
      ).rejects.toThrow(
        new TransactionException(
          'SAME_ACCOUNT_TRANSFER',
          'Cannot transfer to the same account',
        ),
      );
    });

    it('should throw TransactionException when destination account not found', async () => {
      // GIVEN
      const amount = 100;
      const nonExistentToAccountId = 'non-existent-account';

      prismaService.$transaction.mockImplementation(
        async (callback: (prisma: any) => Promise<Transaction>) => {
          const mockPrisma = {
            account: {
              findUnique: jest.fn().mockResolvedValueOnce(null), // toAccount not found
              update: jest.fn(),
            },
            transaction: { create: jest.fn() },
          };
          return callback(mockPrisma);
        },
      );

      // WHEN & THEN
      await expect(
        service.transfer(
          fromAccountId,
          nonExistentToAccountId,
          amount,
          'Test transfer',
        ),
      ).rejects.toThrow(
        new TransactionException(
          'ACCOUNT_NOT_FOUND',
          'Destination account not found',
        ),
      );
    });

    it('should throw TransactionException when source account not found', async () => {
      // GIVEN
      const amount = 100;
      const nonExistentFromAccountId = 'non-existent-account';

      prismaService.$transaction.mockImplementation(
        async (callback: (prisma: any) => Promise<Transaction>) => {
          const mockPrisma = {
            account: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce(toAccount) // toAccount found
                .mockResolvedValueOnce(null), // fromAccount not found
              update: jest.fn(),
            },
            transaction: { create: jest.fn() },
          };
          return callback(mockPrisma);
        },
      );

      // WHEN & THEN
      await expect(
        service.transfer(
          nonExistentFromAccountId,
          toAccountId,
          amount,
          'Test transfer',
        ),
      ).rejects.toThrow(
        new TransactionException(
          'ACCOUNT_NOT_FOUND',
          'Source account not found',
        ),
      );
    });

    it('should throw TransactionException when source account has insufficient funds', async () => {
      // GIVEN
      const amount = 2000; // More than account balance (1000)

      prismaService.$transaction.mockImplementation(
        async (callback: (prisma: any) => Promise<Transaction>) => {
          const mockPrisma = {
            account: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce(toAccount) // toAccount found
                .mockResolvedValueOnce(mockAccount), // fromAccount found
              update: jest.fn(),
            },
            transaction: { create: jest.fn() },
          };
          return callback(mockPrisma);
        },
      );

      // WHEN & THEN
      await expect(
        service.transfer(fromAccountId, toAccountId, amount, 'Test transfer'),
      ).rejects.toThrow(
        new TransactionException(
          'INSUFFICIENT_FUNDS',
          'Insufficient funds for transfer',
        ),
      );
    });

    it('should throw TransactionException when insufficient funds for external transfer with fee', async () => {
      // GIVEN
      const amount = 1000; // Amount that would require 1000 + (1000 * 0.005) = 1005, but account has 1000
      const accountWithLimitedFunds = {
        ...mockAccount,
        balance: 1000, // Just under what's needed with fee
        userId: 1,
      };
      const differentUserToAccount = {
        ...mockAccount,
        id: 'account-2',
        userId: 2,
        type: 'current_account',
      };

      prismaService.$transaction.mockImplementation(
        async (callback: (prisma: any) => Promise<Transaction>) => {
          const mockPrisma = {
            account: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce(differentUserToAccount) // toAccount found
                .mockResolvedValueOnce(accountWithLimitedFunds), // fromAccount found
              update: jest.fn(),
            },
            transaction: { create: jest.fn() },
          };
          return callback(mockPrisma);
        },
      );

      // WHEN & THEN
      await expect(
        service.transfer(
          accountWithLimitedFunds.id,
          differentUserToAccount.id,
          amount,
          'Test transfer',
        ),
      ).rejects.toThrow(
        new TransactionException(
          'INSUFFICIENT_FUNDS',
          'Insufficient funds for transfer',
        ),
      );
    });

    it('should throw TransactionException for external transfer when source account is not current', async () => {
      // GIVEN
      const amount = 100;
      const investmentFromAccount = {
        ...mockInvestmentAccount,
        id: 'investment-from-1',
        userId: 1,
        type: 'investment_account',
      };
      const currentToAccountDifferentUser = {
        ...mockAccount,
        id: 'current-to-1',
        userId: 2, // Different user - external transfer
        type: 'current_account',
      };

      prismaService.$transaction.mockImplementation(
        async (callback: (prisma: any) => Promise<Transaction>) => {
          const mockPrisma = {
            account: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce(currentToAccountDifferentUser) // toAccount found
                .mockResolvedValueOnce(investmentFromAccount), // fromAccount found
              update: jest.fn(),
            },
            transaction: { create: jest.fn() },
          };
          return callback(mockPrisma);
        },
      );

      // WHEN & THEN
      await expect(
        service.transfer(
          investmentFromAccount.id,
          currentToAccountDifferentUser.id,
          amount,
          'Test transfer',
        ),
      ).rejects.toThrow(
        new TransactionException(
          'INVALID_ACCOUNT_TYPE',
          'External transfers are only allowed between current accounts',
        ),
      );
    });

    it('should throw TransactionException for external transfer when destination account is not current', async () => {
      // GIVEN
      const amount = 100;
      const currentFromAccountUser1 = {
        ...mockAccount,
        id: 'current-from-1',
        userId: 1,
        type: 'current_account',
      };
      const investmentToAccountUser2 = {
        ...mockInvestmentAccount,
        id: 'investment-to-1',
        userId: 2, // Different user - external transfer
        type: 'investment_account',
      };

      prismaService.$transaction.mockImplementation(
        async (callback: (prisma: any) => Promise<Transaction>) => {
          const mockPrisma = {
            account: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce(investmentToAccountUser2) // toAccount found
                .mockResolvedValueOnce(currentFromAccountUser1), // fromAccount found
              update: jest.fn(),
            },
            transaction: { create: jest.fn() },
          };
          return callback(mockPrisma);
        },
      );

      // WHEN & THEN
      await expect(
        service.transfer(
          currentFromAccountUser1.id,
          investmentToAccountUser2.id,
          amount,
          'Test transfer',
        ),
      ).rejects.toThrow(
        new TransactionException(
          'INVALID_ACCOUNT_TYPE',
          'External transfers are only allowed between current accounts',
        ),
      );
    });

    it('should throw TransactionException when investment account tries to transfer to investment account (internal)', async () => {
      // GIVEN
      const amount = 100;
      const investmentFromAccount = {
        ...mockInvestmentAccount,
        id: 'investment-from-1',
        userId: 1,
      };
      const investmentToAccount = {
        ...mockInvestmentAccount,
        id: 'investment-to-1',
        userId: 1, // Same user - internal transfer
      };

      prismaService.$transaction.mockImplementation(
        async (callback: (prisma: any) => Promise<Transaction>) => {
          const mockPrisma = {
            account: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce(investmentToAccount) // toAccount found
                .mockResolvedValueOnce(investmentFromAccount), // fromAccount found
              update: jest.fn(),
            },
            transaction: { create: jest.fn() },
          };
          return callback(mockPrisma);
        },
      );

      // WHEN & THEN
      await expect(
        service.transfer(
          investmentFromAccount.id,
          investmentToAccount.id,
          amount,
          'Test transfer',
        ),
      ).rejects.toThrow(
        new TransactionException(
          'INVALID_ACCOUNT_TYPE',
          'Investment account can only transfer to a current account',
        ),
      );
    });

    it('should throw TransactionException when investment account has pending transaction', async () => {
      // GIVEN
      const amount = 100;
      const investmentFromAccountWithPending = {
        ...mockInvestmentAccount,
        id: 'investment-from-1',
        pendingTransaction: true,
      };

      prismaService.$transaction.mockImplementation(
        async (callback: (prisma: any) => Promise<Transaction>) => {
          const mockPrisma = {
            account: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce(toAccount) // toAccount found
                .mockResolvedValueOnce(investmentFromAccountWithPending), // fromAccount found
              update: jest.fn(),
            },
            transaction: { create: jest.fn() },
          };
          return callback(mockPrisma);
        },
      );

      // WHEN & THEN
      await expect(
        service.transfer(
          investmentFromAccountWithPending.id,
          toAccountId,
          amount,
          'Test transfer',
        ),
      ).rejects.toThrow(
        new TransactionException(
          'PENDING_TRANSACTION',
          'Cannot transfer from an account with a pending transaction',
        ),
      );
    });

    it('should create internal transfer when both accounts belong to same user', async () => {
      // GIVEN
      const amount = 100;
      const sameUserToAccount = { ...mockAccount, id: 'account-2', userId: 1 };
      const expectedTransaction = {
        ...mockTransaction,
        fromAccountId,
        toAccountId: sameUserToAccount.id,
        amount,
        type: 'internal',
        description: 'Internal transfer',
      };

      prismaService.$transaction.mockImplementation(
        async (callback: (prisma: any) => Promise<Transaction>) => {
          const mockPrisma = {
            account: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce(sameUserToAccount) // toAccount found
                .mockResolvedValueOnce(mockAccount), // fromAccount found
              update: jest.fn(),
            },
            transaction: {
              create: jest.fn().mockResolvedValue(expectedTransaction),
            },
          };
          return callback(mockPrisma);
        },
      );

      // WHEN
      const result = await service.transfer(
        fromAccountId,
        sameUserToAccount.id,
        amount,
        'Internal transfer',
      );

      // THEN
      expect(result).toEqual(expectedTransaction);
      expect(result.type).toBe('internal');
    });

    it('should create external transfer when accounts belong to different users', async () => {
      // GIVEN
      const amount = 100;
      const currentFromAccount = {
        ...mockAccount,
        id: 'account-1',
        userId: 1,
        type: 'current_account',
      };
      const differentUserToAccount = {
        ...mockAccount,
        id: 'account-2',
        userId: 2,
        type: 'current_account',
      };
      const expectedTransaction = {
        ...mockTransaction,
        fromAccountId: currentFromAccount.id,
        toAccountId: differentUserToAccount.id,
        amount,
        type: 'external',
        description: 'External transfer',
      };

      prismaService.$transaction.mockImplementation(
        async (callback: (prisma: any) => Promise<Transaction>) => {
          const mockPrisma = {
            account: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce(differentUserToAccount) // toAccount found
                .mockResolvedValueOnce(currentFromAccount), // fromAccount found
              update: jest.fn(),
            },
            transaction: {
              create: jest.fn().mockResolvedValue(expectedTransaction),
            },
          };
          return callback(mockPrisma);
        },
      );

      // WHEN
      const result = await service.transfer(
        currentFromAccount.id,
        differentUserToAccount.id,
        amount,
        'External transfer',
      );

      // THEN
      expect(result).toEqual(expectedTransaction);
      expect(result.type).toBe('external');
    });

    it('should apply 0.5% fee for external transfers', async () => {
      // GIVEN
      const amount = 100;
      const fee = amount * 0.005; // 0.5% = 0.5
      const totalDeductedAmount = amount + fee; // 100.5

      const highBalanceAccount = {
        ...mockAccount,
        id: 'account-1',
        balance: 1000, // Enough to cover amount + fee
        userId: 1,
        type: 'current_account',
      };
      const differentUserToAccount = {
        ...mockAccount,
        id: 'account-2',
        userId: 2,
        type: 'current_account',
      };
      const expectedTransaction = {
        ...mockTransaction,
        fromAccountId: highBalanceAccount.id,
        toAccountId: differentUserToAccount.id,
        amount,
        type: 'external',
        description: 'External transfer with fee',
      };

      let updateFromAccountCall: any;
      let updateToAccountCall: any;

      prismaService.$transaction.mockImplementation(
        async (callback: (prisma: any) => Promise<Transaction>) => {
          const mockPrisma = {
            account: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce(differentUserToAccount) // toAccount found
                .mockResolvedValueOnce(highBalanceAccount), // fromAccount found
              update: jest.fn().mockImplementation((params) => {
                if (params.where.id === highBalanceAccount.id) {
                  updateFromAccountCall = params;
                } else if (params.where.id === differentUserToAccount.id) {
                  updateToAccountCall = params;
                }
              }),
            },
            transaction: {
              create: jest.fn().mockResolvedValue(expectedTransaction),
            },
          };
          return callback(mockPrisma);
        },
      );

      // WHEN
      const result = await service.transfer(
        highBalanceAccount.id,
        differentUserToAccount.id,
        amount,
        'External transfer with fee',
      );

      // THEN
      expect(result).toEqual(expectedTransaction);
      expect(updateFromAccountCall.data.balance.decrement).toBe(
        totalDeductedAmount,
      );
      expect(updateToAccountCall.data.balance.increment).toBe(amount);
    });

    it('should allow external transfer between current accounts', async () => {
      // GIVEN
      const amount = 100;
      const currentFromAccount = {
        ...mockAccount,
        id: 'current-from-1',
        userId: 1,
        type: 'current_account',
      };
      const currentToAccount = {
        ...mockAccount,
        id: 'current-to-1',
        userId: 2, // Different user - external transfer
        type: 'current_account',
      };
      const expectedTransaction = {
        ...mockTransaction,
        fromAccountId: currentFromAccount.id,
        toAccountId: currentToAccount.id,
        amount,
        type: 'external',
        description: 'External current to current',
      };

      prismaService.$transaction.mockImplementation(
        async (callback: (prisma: any) => Promise<Transaction>) => {
          const mockPrisma = {
            account: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce(currentToAccount) // toAccount found
                .mockResolvedValueOnce(currentFromAccount), // fromAccount found
              update: jest.fn(),
            },
            transaction: {
              create: jest.fn().mockResolvedValue(expectedTransaction),
            },
          };
          return callback(mockPrisma);
        },
      );

      // WHEN
      const result = await service.transfer(
        currentFromAccount.id,
        currentToAccount.id,
        amount,
        'External current to current',
      );

      // THEN
      expect(result).toEqual(expectedTransaction);
      expect(result.type).toBe('external');
    });

    it('should allow transfer from investment account to current account', async () => {
      // GIVEN
      const amount = 100;
      const fromInvestmentAccount = { ...mockInvestmentAccount, balance: 5000 };
      const expectedTransaction = {
        ...mockTransaction,
        fromAccountId: fromInvestmentAccount.id,
        toAccountId,
        amount,
        description: 'Investment to current',
      };

      prismaService.$transaction.mockImplementation(
        async (callback: (prisma: any) => Promise<Transaction>) => {
          const mockPrisma = {
            account: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce(toAccount) // toAccount found (current account)
                .mockResolvedValueOnce(fromInvestmentAccount), // fromAccount found (investment account)
              update: jest.fn(),
            },
            transaction: {
              create: jest.fn().mockResolvedValue(expectedTransaction),
            },
          };
          return callback(mockPrisma);
        },
      );

      // WHEN
      const result = await service.transfer(
        fromInvestmentAccount.id,
        toAccountId,
        amount,
        'Investment to current',
      );

      // THEN
      expect(result).toEqual(expectedTransaction);
    });

    it('should allow transfer from current account to investment account', async () => {
      // GIVEN
      const amount = 100;
      const toInvestmentAccount = {
        ...mockInvestmentAccount,
        id: 'investment-to-1',
      };
      const expectedTransaction = {
        ...mockTransaction,
        fromAccountId,
        toAccountId: toInvestmentAccount.id,
        amount,
        description: 'Current to investment',
      };

      prismaService.$transaction.mockImplementation(
        async (callback: (prisma: any) => Promise<Transaction>) => {
          const mockPrisma = {
            account: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce(toInvestmentAccount) // toAccount found (investment account)
                .mockResolvedValueOnce(mockAccount), // fromAccount found (current account)
              update: jest.fn(),
            },
            transaction: {
              create: jest.fn().mockResolvedValue(expectedTransaction),
            },
          };
          return callback(mockPrisma);
        },
      );

      // WHEN
      const result = await service.transfer(
        fromAccountId,
        toInvestmentAccount.id,
        amount,
        'Current to investment',
      );

      // THEN
      expect(result).toEqual(expectedTransaction);
    });
  });
});
