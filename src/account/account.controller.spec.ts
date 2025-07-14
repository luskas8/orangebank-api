import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, Transaction } from '@prisma/client';
import { LoggedInUser } from '@src/auth/dto/logged-in-user.dto';
import { TransactionException } from '@src/exception/transaction.exception';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { DepositDto, TransactionDto, WithdrawDto } from './dto/transaction.dto';
import { TransactionService } from './transaction.service';

const mockAccount: Account = {
  id: '1',
  userId: 1,
  active: true,
  balance: 1000,
  type: 'current_account',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  pendingTransaction: false,
};

const mockInvestmentAccount: Account = {
  id: '2',
  userId: 1,
  active: true,
  balance: 5000,
  type: 'investment_account',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  pendingTransaction: false,
};

const mockTransaction: Transaction = {
  id: '1',
  fromAccountId: '1',
  toAccountId: '2',
  amount: 100,
  category: 'transfer',
  description: 'Test transaction',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  type: 'internal',
};

const mockTransactionWithAccounts = {
  ...mockTransaction,
  fromAccount: { id: '1', user: { name: 'John Doe', cpf: '***123456' } },
  toAccount: { id: '2', user: { name: 'Jane Smith', cpf: '***654321' } },
};

const mockUser: LoggedInUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  password: 'password123',
  cpf: '12345678901',
  birthDate: '1990-01-01',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('AccountController', () => {
  let controller: AccountController;
  let accountService: jest.Mocked<AccountService>;
  let transactionService: jest.Mocked<TransactionService>;

  beforeEach(async () => {
    const mockAccountService = {
      create: jest.fn(),
      findByUser: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const mockTransactionService = {
      deposit: jest.fn(),
      withdraw: jest.fn(),
      transfer: jest.fn(),
      getTransactionHistory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        {
          provide: AccountService,
          useValue: mockAccountService,
        },
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
      ],
    }).compile();

    controller = module.get<AccountController>(AccountController);
    accountService = module.get(AccountService);
    transactionService = module.get(TransactionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an account successfully', async () => {
      // GIVEN
      const createAccountDto: CreateAccountDto = {
        balance: 1000,
        type: 'current_account',
        active: true,
        userId: 1,
      };
      accountService.create.mockResolvedValue(mockAccount);

      // WHEN
      const result = await controller.create(createAccountDto);

      // THEN
      expect(result).toEqual(mockAccount);
      expect(accountService.create).toHaveBeenCalledWith(createAccountDto);
    });

    it('should throw BadRequestException when account creation fails', async () => {
      // GIVEN
      const createAccountDto: CreateAccountDto = {
        balance: 1000,
        type: 'current_account',
        active: true,
        userId: 1,
      };
      accountService.create.mockResolvedValue(null);

      // WHEN & THEN
      await expect(controller.create(createAccountDto)).rejects.toThrow(
        new BadRequestException(
          'Account creation failed. Please check your input data and try again.',
        ),
      );
    });
  });

  describe('findByUser', () => {
    it('should return accounts for user', async () => {
      // GIVEN
      const accounts = [mockAccount, mockInvestmentAccount];
      accountService.findByUser.mockResolvedValue(accounts);

      // WHEN
      const result = await controller.findByUser(mockUser);

      // THEN
      expect(result).toEqual(accounts);
      expect(accountService.findByUser).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException when no accounts found', async () => {
      // GIVEN
      accountService.findByUser.mockResolvedValue(null);

      // WHEN & THEN
      await expect(controller.findByUser(mockUser)).rejects.toThrow(
        new NotFoundException(
          'No accounts found for this user. Please create an account first.',
        ),
      );
    });
  });

  describe('findOne', () => {
    it('should return account by id', async () => {
      // GIVEN
      const accountId = '1';
      accountService.findOne.mockResolvedValue(mockAccount);

      // WHEN
      const result = await controller.findOne(accountId);

      // THEN
      expect(result).toEqual(mockAccount);
      expect(accountService.findOne).toHaveBeenCalledWith(accountId);
    });

    it('should throw NotFoundException when account not found', async () => {
      // GIVEN
      const accountId = 'non-existent';
      accountService.findOne.mockResolvedValue(null);

      // WHEN & THEN
      await expect(controller.findOne(accountId)).rejects.toThrow(
        new NotFoundException(
          `Account with ID ${accountId} not found. Please verify the account ID.`,
        ),
      );
    });
  });

  describe('activate', () => {
    it('should activate account successfully', async () => {
      // GIVEN
      const accountId = '1';
      const activatedAccount = { ...mockAccount, active: true };
      accountService.update.mockResolvedValue(activatedAccount);

      // WHEN
      const result = await controller.activate(accountId);

      // THEN
      expect(result).toEqual(activatedAccount);
      expect(accountService.update).toHaveBeenCalledWith(accountId, true);
    });

    it('should throw BadRequestException when activation fails', async () => {
      // GIVEN
      const accountId = '1';
      accountService.update.mockResolvedValue(null);

      // WHEN & THEN
      await expect(controller.activate(accountId)).rejects.toThrow(
        new BadRequestException(
          `Failed to activate account ${accountId}. Account may not exist or is already active.`,
        ),
      );
    });
  });

  describe('deactivate', () => {
    it('should deactivate account successfully', async () => {
      // GIVEN
      const accountId = '1';
      const deactivatedAccount = { ...mockAccount, active: false };
      accountService.update.mockResolvedValue(deactivatedAccount);

      // WHEN
      const result = await controller.deactivate(accountId);

      // THEN
      expect(result).toEqual(deactivatedAccount);
      expect(accountService.update).toHaveBeenCalledWith(accountId, false);
    });

    it('should throw BadRequestException when deactivation fails', async () => {
      // GIVEN
      const accountId = '1';
      accountService.update.mockResolvedValue(null);

      // WHEN & THEN
      await expect(controller.deactivate(accountId)).rejects.toThrow(
        new BadRequestException(
          `Failed to deactivate account ${accountId}. Account may not exist or is already inactive.`,
        ),
      );
    });
  });

  describe('deposit', () => {
    it('should make deposit successfully', async () => {
      // GIVEN
      const depositDto: DepositDto = { amount: 100 };
      const accounts = [mockAccount];
      accountService.findByUser.mockResolvedValue(accounts);
      transactionService.deposit.mockResolvedValue(mockTransaction);

      // WHEN
      const result = await controller.deposit(mockUser, depositDto);

      // THEN
      expect(result).toEqual(mockTransaction);
      expect(transactionService.deposit).toHaveBeenCalledWith(
        mockAccount.id,
        depositDto.amount,
      );
    });

    it('should throw NotFoundException when no accounts found', async () => {
      // GIVEN
      const depositDto: DepositDto = { amount: 100 };
      accountService.findByUser.mockResolvedValue(null);

      // WHEN & THEN
      await expect(controller.deposit(mockUser, depositDto)).rejects.toThrow(
        new NotFoundException(
          'No accounts found for this user. Please create an account first.',
        ),
      );
    });

    it('should throw NotFoundException when no current account found', async () => {
      // GIVEN
      const depositDto: DepositDto = { amount: 100 };
      const accounts = [mockInvestmentAccount]; // Only investment account
      accountService.findByUser.mockResolvedValue(accounts);

      // WHEN & THEN
      await expect(controller.deposit(mockUser, depositDto)).rejects.toThrow(
        new NotFoundException(
          'No current account found. Deposits can only be made to current accounts.',
        ),
      );
    });

    it('should propagate TransactionException from service', async () => {
      // GIVEN
      const depositDto: DepositDto = { amount: -100 };
      const accounts = [mockAccount];
      accountService.findByUser.mockResolvedValue(accounts);
      transactionService.deposit.mockRejectedValue(
        new TransactionException(
          'INVALID_AMOUNT',
          'Amount must be greater than zero',
        ),
      );

      // WHEN & THEN
      await expect(controller.deposit(mockUser, depositDto)).rejects.toThrow(
        TransactionException,
      );
    });
  });

  describe('withdraw', () => {
    it('should make withdrawal successfully', async () => {
      // GIVEN
      const withdrawDto: WithdrawDto = { amount: 100 };
      const accounts = [mockAccount];
      accountService.findByUser.mockResolvedValue(accounts);
      transactionService.withdraw.mockResolvedValue(mockTransaction);

      // WHEN
      const result = await controller.withdraw(mockUser, withdrawDto);

      // THEN
      expect(result).toEqual(mockTransaction);
      expect(transactionService.withdraw).toHaveBeenCalledWith(
        mockAccount.id,
        withdrawDto.amount,
      );
    });

    it('should throw NotFoundException when no accounts found', async () => {
      // GIVEN
      const withdrawDto: WithdrawDto = { amount: 100 };
      accountService.findByUser.mockResolvedValue([]);

      // WHEN & THEN
      await expect(controller.withdraw(mockUser, withdrawDto)).rejects.toThrow(
        new NotFoundException(
          'No accounts found for this user. Please create an account first.',
        ),
      );
    });

    it('should throw NotFoundException when no current account found', async () => {
      // GIVEN
      const withdrawDto: WithdrawDto = { amount: 100 };
      const accounts = [mockInvestmentAccount]; // Only investment account
      accountService.findByUser.mockResolvedValue(accounts);

      // WHEN & THEN
      await expect(controller.withdraw(mockUser, withdrawDto)).rejects.toThrow(
        new NotFoundException(
          'No current account found. Withdrawals can only be made from current accounts.',
        ),
      );
    });
  });

  describe('transfer', () => {
    it('should make transfer successfully', async () => {
      // GIVEN
      const transferDto: TransactionDto = {
        fromAccountType: 'current_account',
        toAccountId: '2',
        amount: 100,
        description: 'Test transfer',
      };
      const accounts = [mockAccount, mockInvestmentAccount];
      accountService.findByUser.mockResolvedValue(accounts);
      transactionService.transfer.mockResolvedValue(mockTransaction);

      // WHEN
      const result = await controller.transfer(mockUser, transferDto);

      // THEN
      expect(result).toEqual(mockTransaction);
      expect(transactionService.transfer).toHaveBeenCalledWith(
        mockAccount.id,
        transferDto.toAccountId,
        transferDto.amount,
        transferDto.description,
      );
    });

    it('should throw NotFoundException when no accounts found', async () => {
      // GIVEN
      const transferDto: TransactionDto = {
        fromAccountType: 'current_account',
        toAccountId: '2',
        amount: 100,
      };
      accountService.findByUser.mockResolvedValue(null);

      // WHEN & THEN
      await expect(controller.transfer(mockUser, transferDto)).rejects.toThrow(
        new NotFoundException(
          'No accounts found for this user. Please create an account first.',
        ),
      );
    });

    it('should throw NotFoundException when source account type not found', async () => {
      // GIVEN
      const transferDto: TransactionDto = {
        fromAccountType: 'investment_account',
        toAccountId: '2',
        amount: 100,
      };
      const accounts = [mockAccount]; // Only current account
      accountService.findByUser.mockResolvedValue(accounts);

      // WHEN & THEN
      await expect(controller.transfer(mockUser, transferDto)).rejects.toThrow(
        new NotFoundException(
          `Account type 'investment_account' not found for this user.`,
        ),
      );
    });
  });

  describe('getTransactions', () => {
    it('should return transaction history successfully', async () => {
      // GIVEN
      const accountId = '1';
      const limit = 10;
      const offset = 0;
      const transactions = [mockTransactionWithAccounts];
      accountService.findOne.mockResolvedValue(mockAccount);
      transactionService.getTransactionHistory.mockResolvedValue(transactions);

      // WHEN
      const result = await controller.getTransactions(
        mockUser,
        accountId,
        limit,
        offset,
      );

      // THEN
      expect(result).toEqual(transactions);
      expect(accountService.findOne).toHaveBeenCalledWith(accountId);
      expect(transactionService.getTransactionHistory).toHaveBeenCalledWith(
        accountId,
        limit,
        offset,
      );
    });

    it('should throw NotFoundException when account not found', async () => {
      // GIVEN
      const accountId = 'non-existent';
      accountService.findOne.mockResolvedValue(null);

      // WHEN & THEN
      await expect(
        controller.getTransactions(mockUser, accountId),
      ).rejects.toThrow(
        new NotFoundException(
          `Account with ID ${accountId} not found. Please verify the account ID.`,
        ),
      );
    });

    it('should throw UnauthorizedException when user does not own account', async () => {
      // GIVEN
      const accountId = '1';
      const otherUserAccount = { ...mockAccount, userId: 999 };
      accountService.findOne.mockResolvedValue(otherUserAccount);

      // WHEN & THEN
      await expect(
        controller.getTransactions(mockUser, accountId),
      ).rejects.toThrow(
        new UnauthorizedException(
          'You do not have permission to access this account.',
        ),
      );
    });

    it('should throw NotFoundException when no transactions found', async () => {
      // GIVEN
      const accountId = '1';
      accountService.findOne.mockResolvedValue(mockAccount);
      transactionService.getTransactionHistory.mockResolvedValue([]);

      // WHEN & THEN
      await expect(
        controller.getTransactions(mockUser, accountId),
      ).rejects.toThrow(
        new NotFoundException('No transactions found for this account.'),
      );
    });

    it('should use default values for limit and offset', async () => {
      // GIVEN
      const accountId = '1';
      const transactions = [mockTransactionWithAccounts];
      accountService.findOne.mockResolvedValue(mockAccount);
      transactionService.getTransactionHistory.mockResolvedValue(transactions);

      // WHEN
      await controller.getTransactions(mockUser, accountId);

      // THEN
      expect(transactionService.getTransactionHistory).toHaveBeenCalledWith(
        accountId,
        5, // default limit
        0, // default offset
      );
    });

    it('should throw BadRequestException when service throws unexpected error', async () => {
      // GIVEN
      const accountId = '1';
      accountService.findOne.mockResolvedValue(mockAccount);
      transactionService.getTransactionHistory.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // WHEN & THEN
      await expect(
        controller.getTransactions(mockUser, accountId),
      ).rejects.toThrow(
        new BadRequestException(
          'Failed to retrieve transaction history. Please try again later.',
        ),
      );
    });

    it('should not catch and re-throw NotFoundException from service', async () => {
      // GIVEN
      const accountId = '1';
      const notFoundError = new NotFoundException('Service level not found');
      accountService.findOne.mockResolvedValue(mockAccount);
      transactionService.getTransactionHistory.mockRejectedValue(notFoundError);

      // WHEN & THEN
      await expect(
        controller.getTransactions(mockUser, accountId),
      ).rejects.toThrow(notFoundError);
    });

    it('should not catch and re-throw UnauthorizedException from service', async () => {
      // GIVEN
      const accountId = '1';
      const unauthorizedError = new UnauthorizedException(
        'Service level unauthorized',
      );
      accountService.findOne.mockResolvedValue(mockAccount);
      transactionService.getTransactionHistory.mockRejectedValue(
        unauthorizedError,
      );

      // WHEN & THEN
      await expect(
        controller.getTransactions(mockUser, accountId),
      ).rejects.toThrow(unauthorizedError);
    });
  });
});
