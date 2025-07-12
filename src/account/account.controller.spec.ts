import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, Transaction } from '@prisma/client';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
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
      findByUser: jest.fn(),
      update: jest.fn(),
    };

    const mockTransactionService = {
      deposit: jest.fn(),
      withdraw: jest.fn(),
      transfer: jest.fn(),
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

  describe('findByUser', () => {
    it('should find accounts by user successfully', async () => {
      // GIVEN
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
        cpf: '123.456.789-00',
        birthDate: '1990-01-01',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };
      const mockAccounts = [mockAccount, { ...mockAccount, id: '2' }];
      accountService.findByUser.mockResolvedValue(mockAccounts);

      // WHEN
      const result = await controller.findByUser(mockUser);

      // THEN
      expect(result).toEqual(mockAccounts);
      expect(accountService.findByUser).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return NotFoundException if no accounts found for user', async () => {
      // GIVEN
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
        cpf: '123.456.789-00',
        birthDate: '1990-01-01',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };
      accountService.findByUser.mockResolvedValue(null);

      // WHEN
      const result = await controller.findByUser(mockUser);

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
      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
        cpf: '123.456.789-00',
        birthDate: '1990-01-01',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };
      const dto = { amount: 100, description: 'Test deposit' };
      const accounts = [mockAccount];

      accountService.findByUser.mockResolvedValue(accounts);
      transactionService.deposit.mockResolvedValue(mockTransaction);

      // WHEN
      const result = await controller.deposit(user, dto);

      // THEN
      expect(result).toEqual(mockTransaction);
      expect(accountService.findByUser).toHaveBeenCalledWith(user.id);
      expect(transactionService.deposit).toHaveBeenCalledWith(
        mockAccount.id,
        dto.amount,
      );
    });

    it('should return NotFoundException if no accounts found for user', async () => {
      // GIVEN
      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
        cpf: '123.456.789-00',
        birthDate: '1990-01-01',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };
      const dto = { amount: 100, description: 'Test deposit' };

      accountService.findByUser.mockResolvedValue(null);

      // WHEN
      const result = await controller.deposit(user, dto);

      // THEN
      expect(result).toBeInstanceOf(NotFoundException);
      expect((result as NotFoundException).message).toBe(
        'No accounts found for user',
      );
    });

    it('should return NotFoundException if no current account found', async () => {
      // GIVEN
      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
        cpf: '123.456.789-00',
        birthDate: '1990-01-01',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };
      const dto = { amount: 100, description: 'Test deposit' };
      const accounts = [{ ...mockAccount, type: 'investment_account' as any }];

      accountService.findByUser.mockResolvedValue(accounts);

      // WHEN
      const result = await controller.deposit(user, dto);

      // THEN
      expect(result).toBeInstanceOf(NotFoundException);
      expect((result as NotFoundException).message).toBe(
        'Current account not found',
      );
    });

    it('should return BadRequestException if deposit fails', async () => {
      // GIVEN
      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
        cpf: '123.456.789-00',
        birthDate: '1990-01-01',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };
      const dto = { amount: 100, description: 'Test deposit' };
      const accounts = [mockAccount];

      accountService.findByUser.mockResolvedValue(accounts);
      transactionService.deposit.mockRejectedValue(
        new Error('Transaction failed'),
      );

      // WHEN
      const result = await controller.deposit(user, dto);

      // THEN
      expect(result).toBeInstanceOf(BadRequestException);
      expect((result as BadRequestException).message).toBe('Deposit failed');
    });
  });

  describe('withdraw', () => {
    it('should make a withdrawal successfully', async () => {
      // GIVEN
      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
        cpf: '123.456.789-00',
        birthDate: '1990-01-01',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };
      const dto = { amount: 100, description: 'Test withdrawal' };
      const accounts = [mockAccount];
      const withdrawalTransaction = {
        ...mockTransaction,
        fromAccountId: '1',
        toAccountId: null,
      };

      accountService.findByUser.mockResolvedValue(accounts);
      transactionService.withdraw.mockResolvedValue(withdrawalTransaction);

      // WHEN
      const result = await controller.withdraw(user, dto);

      // THEN
      expect(result).toEqual(withdrawalTransaction);
      expect(accountService.findByUser).toHaveBeenCalledWith(user.id);
      expect(transactionService.withdraw).toHaveBeenCalledWith(
        mockAccount.id,
        dto.amount,
      );
    });

    it('should return NotFoundException if no accounts found for user', async () => {
      // GIVEN
      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
        cpf: '123.456.789-00',
        birthDate: '1990-01-01',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };
      const dto = { amount: 100, description: 'Test withdrawal' };

      accountService.findByUser.mockResolvedValue(null);

      // WHEN
      const result = await controller.withdraw(user, dto);

      // THEN
      expect(result).toBeInstanceOf(NotFoundException);
      expect((result as NotFoundException).message).toBe(
        'No accounts found for user',
      );
    });

    it('should return NotFoundException if no current account found', async () => {
      // GIVEN
      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
        cpf: '123.456.789-00',
        birthDate: '1990-01-01',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };
      const dto = { amount: 100, description: 'Test withdrawal' };
      const accounts = [{ ...mockAccount, type: 'investment_account' as any }];

      accountService.findByUser.mockResolvedValue(accounts);

      // WHEN
      const result = await controller.withdraw(user, dto);

      // THEN
      expect(result).toBeInstanceOf(NotFoundException);
      expect((result as NotFoundException).message).toBe(
        'Current account not found',
      );
    });

    it('should return BadRequestException if withdrawal fails', async () => {
      // GIVEN
      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
        cpf: '123.456.789-00',
        birthDate: '1990-01-01',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };
      const dto = { amount: 100, description: 'Test withdrawal' };
      const accounts = [mockAccount];

      accountService.findByUser.mockResolvedValue(accounts);
      transactionService.withdraw.mockRejectedValue(
        new Error('Insufficient funds'),
      );

      // WHEN
      const result = await controller.withdraw(user, dto);

      // THEN
      expect(result).toBeInstanceOf(BadRequestException);
      expect((result as BadRequestException).message).toBe('Withdraw failed');
    });
  });

  describe('transfer', () => {
    it('should make a transfer successfully', async () => {
      // GIVEN
      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
        cpf: '123.456.789-00',
        birthDate: '1990-01-01',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };
      const dto = {
        amount: 100,
        toAccountId: '2',
        fromAccountType: 'current_account' as any,
        description: 'Test transfer',
      };
      const accounts = [mockAccount];
      const transferTransaction = {
        ...mockTransaction,
        fromAccountId: '1',
        toAccountId: '2',
        amount: 100,
        description: 'Test transfer',
      };

      accountService.findByUser.mockResolvedValue(accounts);
      transactionService.transfer.mockResolvedValue(transferTransaction);

      // WHEN
      const result = await controller.transfer(user, dto);

      // THEN
      expect(result).toEqual(transferTransaction);
      expect(accountService.findByUser).toHaveBeenCalledWith(user.id);
      expect(transactionService.transfer).toHaveBeenCalledWith(
        mockAccount.id,
        dto.toAccountId,
        dto.amount,
        dto.description,
      );
    });

    it('should return NotFoundException if no accounts found for user', async () => {
      // GIVEN
      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
        cpf: '123.456.789-00',
        birthDate: '1990-01-01',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };
      const dto = {
        amount: 100,
        toAccountId: '2',
        fromAccountType: 'current_account' as any,
        description: 'Test transfer',
      };

      accountService.findByUser.mockResolvedValue(null);

      // WHEN
      const result = await controller.transfer(user, dto);

      // THEN
      expect(result).toBeInstanceOf(NotFoundException);
      expect((result as NotFoundException).message).toBe(
        'No accounts found for user',
      );
    });

    it('should return NotFoundException if account type not found', async () => {
      // GIVEN
      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
        cpf: '123.456.789-00',
        birthDate: '1990-01-01',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };
      const dto = {
        amount: 100,
        toAccountId: '2',
        fromAccountType: 'investment_account' as any,
        description: 'Test transfer',
      };
      const accounts = [mockAccount]; // mockAccount has type 'current_account'

      accountService.findByUser.mockResolvedValue(accounts);

      // WHEN
      const result = await controller.transfer(user, dto);

      // THEN
      expect(result).toBeInstanceOf(NotFoundException);
      expect((result as NotFoundException).message).toBe(
        'Current account not found',
      );
    });

    it('should return BadRequestException if transfer fails', async () => {
      // GIVEN
      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
        cpf: '123.456.789-00',
        birthDate: '1990-01-01',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };
      const dto = {
        amount: 100,
        toAccountId: '2',
        fromAccountType: 'current_account' as any,
        description: 'Test transfer',
      };
      const accounts = [mockAccount];

      accountService.findByUser.mockResolvedValue(accounts);
      transactionService.transfer.mockRejectedValue(
        new Error('Transfer failed'),
      );

      // WHEN
      const result = await controller.transfer(user, dto);

      // THEN
      expect(result).toBeInstanceOf(BadRequestException);
      expect((result as BadRequestException).message).toBe('Transfer failed');
    });
  });
});
