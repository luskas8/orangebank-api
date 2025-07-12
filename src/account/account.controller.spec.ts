import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, Transaction } from '@prisma/client';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { TransactionDto } from './dto/simple-transaction.dto';
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

const mockTransaction: Transaction = {
  id: '1',
  amount: 100,
  toAccountId: '1',
  fromAccountId: null,
  description: 'Test transaction',
  type: 'internal',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

describe('AccountController', () => {
  let controller: AccountController;
  let accountService: jest.Mocked<AccountService>;
  let transactionService: jest.Mocked<TransactionService>;

  beforeEach(async () => {
    const mockAccountService = {
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const mockTransactionService = {
      deposit: jest.fn(),
      withdraw: jest.fn(),
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
      const input: CreateAccountDto = {
        active: true,
        balance: 1000,
        type: 'current_account',
        userId: 1,
      };
      accountService.create.mockResolvedValue(mockAccount);

      // WHEN
      const result = await controller.create(input);

      // THEN
      expect(result).toEqual(mockAccount);
      expect(accountService.create).toHaveBeenCalledWith(input);
    });

    it('should return BadRequestException if account creation fails', async () => {
      // GIVEN
      const input: CreateAccountDto = {
        active: true,
        balance: 1000,
        type: 'current_account',
        userId: 1,
      };
      accountService.create.mockResolvedValue(null);

      // WHEN
      const result = await controller.create(input);

      // THEN
      expect(result).toBeInstanceOf(BadRequestException);
      expect((result as BadRequestException).message).toBe(
        'Account creation failed',
      );
    });
  });

  describe('findOne', () => {
    it('should find an account successfully', async () => {
      // GIVEN
      const id = '1';
      accountService.findOne.mockResolvedValue(mockAccount);

      // WHEN
      const result = await controller.findOne(id);

      // THEN
      expect(result).toEqual(mockAccount);
      expect(accountService.findOne).toHaveBeenCalledWith(id);
    });

    it('should return NotFoundException if account not found', async () => {
      // GIVEN
      const id = 'non-existent';
      accountService.findOne.mockResolvedValue(null);

      // WHEN
      const result = await controller.findOne(id);

      // THEN
      expect(result).toBeInstanceOf(NotFoundException);
      expect((result as NotFoundException).message).toBe('Account not found');
    });
  });

  describe('activate', () => {
    it('should activate an account successfully', async () => {
      // GIVEN
      const id = '1';
      const activatedAccount = { ...mockAccount, active: true };
      accountService.update.mockResolvedValue(activatedAccount);

      // WHEN
      const result = await controller.activate(id);

      // THEN
      expect(result).toEqual(activatedAccount);
      expect(accountService.update).toHaveBeenCalledWith(id, true);
    });

    it('should return BadRequestException if activation fails', async () => {
      // GIVEN
      const id = '1';
      accountService.update.mockResolvedValue(null);

      // WHEN
      const result = await controller.activate(id);

      // THEN
      expect(result).toBeInstanceOf(BadRequestException);
      expect((result as BadRequestException).message).toBe(
        'Account activation failed',
      );
    });
  });

  describe('deactivate', () => {
    it('should deactivate an account successfully', async () => {
      // GIVEN
      const id = '1';
      const deactivatedAccount = { ...mockAccount, active: false };
      accountService.update.mockResolvedValue(deactivatedAccount);

      // WHEN
      const result = await controller.deactivate(id);

      // THEN
      expect(result).toEqual(deactivatedAccount);
      expect(accountService.update).toHaveBeenCalledWith(id, false);
    });

    it('should return BadRequestException if deactivation fails', async () => {
      // GIVEN
      const id = '1';
      accountService.update.mockResolvedValue(null);

      // WHEN
      const result = await controller.deactivate(id);

      // THEN
      expect(result).toBeInstanceOf(BadRequestException);
      expect((result as BadRequestException).message).toBe(
        'Account deactivation failed',
      );
    });
  });

  describe('deposit', () => {
    it('should make a deposit successfully', async () => {
      // GIVEN
      const dto: TransactionDto = {
        amount: 100,
        toAccountId: '1',
        description: 'Test deposit',
      };
      transactionService.deposit.mockResolvedValue(mockTransaction);

      // WHEN
      const result = await controller.deposit(dto);

      // THEN
      expect(result).toEqual(mockTransaction);
      expect(transactionService.deposit).toHaveBeenCalledWith(
        dto.toAccountId,
        dto.amount,
      );
    });

    it('should return BadRequestException if toAccountId is missing', async () => {
      // GIVEN
      const dto: TransactionDto = {
        amount: 100,
        description: 'Test deposit',
      };

      // WHEN
      const result = await controller.deposit(dto);

      // THEN
      expect(result).toBeInstanceOf(BadRequestException);
      expect((result as BadRequestException).message).toBe(
        'toAccountId is required',
      );
    });

    it('should return BadRequestException if deposit fails', async () => {
      // GIVEN
      const dto: TransactionDto = {
        amount: 100,
        toAccountId: '1',
        description: 'Test deposit',
      };
      transactionService.deposit.mockRejectedValue(
        new Error('Account not found'),
      );

      // WHEN
      const result = await controller.deposit(dto);

      // THEN
      expect(result).toBeInstanceOf(BadRequestException);
      expect((result as BadRequestException).message).toBe('Deposit failed');
    });
  });

  describe('withdraw', () => {
    it('should make a withdrawal successfully', async () => {
      // GIVEN
      const dto: TransactionDto = {
        amount: 100,
        fromAccountId: '1',
        description: 'Test withdrawal',
      };
      const withdrawalTransaction = {
        ...mockTransaction,
        fromAccountId: '1',
        toAccountId: null,
      };
      transactionService.withdraw.mockResolvedValue(withdrawalTransaction);

      // WHEN
      const result = await controller.withdraw(dto);

      // THEN
      expect(result).toEqual(withdrawalTransaction);
      expect(transactionService.withdraw).toHaveBeenCalledWith(
        dto.fromAccountId,
        dto.amount,
      );
    });

    it('should return BadRequestException if fromAccountId is missing', async () => {
      // GIVEN
      const dto: TransactionDto = {
        amount: 100,
        description: 'Test withdrawal',
      };

      // WHEN
      const result = await controller.withdraw(dto);

      // THEN
      expect(result).toBeInstanceOf(BadRequestException);
      expect((result as BadRequestException).message).toBe(
        'fromAccountId is required',
      );
    });

    it('should return BadRequestException if withdrawal fails', async () => {
      // GIVEN
      const dto: TransactionDto = {
        amount: 100,
        fromAccountId: '1',
        description: 'Test withdrawal',
      };
      transactionService.withdraw.mockRejectedValue(
        new Error('Insufficient funds'),
      );

      // WHEN
      const result = await controller.withdraw(dto);

      // THEN
      expect(result).toBeInstanceOf(BadRequestException);
      expect((result as BadRequestException).message).toBe('Withdraw failed');
    });
  });
});
