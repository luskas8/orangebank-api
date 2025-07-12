import { PrismaService } from '@database/prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, Transaction } from '@prisma/client';
import { TransactionException } from '@src/exception/transaction.exception';
import { TransactionService } from './transaction.service';

const mockAccount: Account = {
  id: 'account-1',
  active: true,
  balance: 1000,
  type: 'current_account',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  pendingTransaction: false,
};

const mockInvestmentAccount: Account = {
  id: 'investment-account-1',
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
      // Arrange
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

      // Act
      const result = await service.deposit(accountId, amount);

      // Assert
      expect(result).toEqual(expectedTransaction);
      expect(prismaService.account.findUnique).toHaveBeenCalledWith({
        where: { id: accountId },
      });
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw TransactionException when amount is zero', async () => {
      // Arrange
      const accountId = 'account-1';
      const amount = 0;

      // Act & Assert
      await expect(service.deposit(accountId, amount)).rejects.toThrow(
        new TransactionException(
          'INVALID_AMOUNT',
          'Amount must be greater than zero',
        ),
      );
    });

    it('should throw TransactionException when amount is negative', async () => {
      // Arrange
      const accountId = 'account-1';
      const amount = -100;

      // Act & Assert
      await expect(service.deposit(accountId, amount)).rejects.toThrow(
        new TransactionException(
          'INVALID_AMOUNT',
          'Amount must be greater than zero',
        ),
      );
    });

    it('should throw TransactionException when account not found', async () => {
      // Arrange
      const accountId = 'non-existent-account';
      const amount = 100;

      prismaService.account.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deposit(accountId, amount)).rejects.toThrow(
        new TransactionException('ACCOUNT_NOT_FOUND', 'Account not found'),
      );
    });

    it('should throw TransactionException when trying to deposit to investment account', async () => {
      // Arrange
      const accountId = 'investment-account-1';
      const amount = 100;

      prismaService.account.findUnique.mockResolvedValue(mockInvestmentAccount);

      // Act & Assert
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
      // Arrange
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

      // Act
      const result = await service.withdraw(accountId, amount);

      // Assert
      expect(result).toEqual(expectedTransaction);
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw TransactionException when amount is zero', async () => {
      // Arrange
      const accountId = 'account-1';
      const amount = 0;

      // Act & Assert
      await expect(service.withdraw(accountId, amount)).rejects.toThrow(
        new TransactionException(
          'INVALID_AMOUNT',
          'Amount must be greater than zero',
        ),
      );
    });

    it('should throw TransactionException when amount is negative', async () => {
      // Arrange
      const accountId = 'account-1';
      const amount = -100;

      // Act & Assert
      await expect(service.withdraw(accountId, amount)).rejects.toThrow(
        new TransactionException(
          'INVALID_AMOUNT',
          'Amount must be greater than zero',
        ),
      );
    });

    it('should throw TransactionException when account not found', async () => {
      // Arrange
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

      // Act & Assert
      await expect(service.withdraw(accountId, amount)).rejects.toThrow(
        new TransactionException('ACCOUNT_NOT_FOUND', 'Account not found'),
      );
    });

    it('should throw TransactionException when trying to withdraw from investment account', async () => {
      // Arrange
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

      // Act & Assert
      await expect(service.withdraw(accountId, amount)).rejects.toThrow(
        new TransactionException(
          'INVALID_ACCOUNT_TYPE',
          'Operation not allowed on investment accounts',
        ),
      );
    });

    it('should throw TransactionException when insufficient funds', async () => {
      // Arrange
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

      // Act & Assert
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
      // Arrange
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

      // Act
      const result = await service.transfer(fromAccountId, toAccountId, amount);

      // Assert
      expect(result).toEqual(expectedTransaction);
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw TransactionException when amount is zero', async () => {
      // Arrange
      const amount = 0;

      // Act & Assert
      await expect(
        service.transfer(fromAccountId, toAccountId, amount),
      ).rejects.toThrow(
        new TransactionException(
          'INVALID_AMOUNT',
          'Amount must be greater than zero',
        ),
      );
    });

    it('should throw TransactionException when amount is negative', async () => {
      // Arrange
      const amount = -100;

      // Act & Assert
      await expect(
        service.transfer(fromAccountId, toAccountId, amount),
      ).rejects.toThrow(
        new TransactionException(
          'INVALID_AMOUNT',
          'Amount must be greater than zero',
        ),
      );
    });

    it('should throw TransactionException when transferring to same account', async () => {
      // Arrange
      const amount = 100;
      const sameAccountId = 'account-1';

      // Act & Assert
      await expect(
        service.transfer(sameAccountId, sameAccountId, amount),
      ).rejects.toThrow(
        new TransactionException(
          'SAME_ACCOUNT_TRANSFER',
          'Cannot transfer to the same account',
        ),
      );
    });

    it('should throw TransactionException when destination account not found', async () => {
      // Arrange
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

      // Act & Assert
      await expect(
        service.transfer(fromAccountId, nonExistentToAccountId, amount),
      ).rejects.toThrow(
        new TransactionException(
          'ACCOUNT_NOT_FOUND',
          'Destination account not found',
        ),
      );
    });

    it('should throw TransactionException when source account not found', async () => {
      // Arrange
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

      // Act & Assert
      await expect(
        service.transfer(nonExistentFromAccountId, toAccountId, amount),
      ).rejects.toThrow(
        new TransactionException(
          'ACCOUNT_NOT_FOUND',
          'Source account not found',
        ),
      );
    });

    it('should throw TransactionException when source account has insufficient funds', async () => {
      // Arrange
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

      // Act & Assert
      await expect(
        service.transfer(fromAccountId, toAccountId, amount),
      ).rejects.toThrow(
        new TransactionException(
          'INSUFFICIENT_FUNDS',
          'Insufficient funds for transfer',
        ),
      );
    });
  });
});
