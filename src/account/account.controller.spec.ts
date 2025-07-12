import { PrismaService } from '@database/prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, Transaction } from '@prisma/client';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { TransactionDto } from './dto/simple-transaction.dto';

describe('AccountController', () => {
  let controller: AccountController;
  let service: AccountService;

  const input = {
    active: true,
    balance: 1000,
    type: 'current_account',
  } as CreateAccountDto;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [AccountService, PrismaService],
    }).compile();

    controller = module.get<AccountController>(AccountController);
    service = module.get<AccountService>(AccountService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an account', async () => {
    // WHEN
    jest
      .spyOn(service, 'create')
      .mockResolvedValue(input as unknown as Account);

    // THEN
    const account = await controller.create(input);
    expect(account).toBeDefined();
    expect(account).toHaveProperty('balance', input.balance);
  });

  it('should find one account', async () => {
    // GIVEN
    const id = '1';

    // WHEN
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValue(input as unknown as Account);

    // THEN
    const account = await controller.findOne(id);
    expect(account).toBeDefined();
    expect(account).toHaveProperty('balance', input.balance);
  });

  it('should activate an account', async () => {
    // GIVEN
    const id = '1';

    // WHEN
    jest
      .spyOn(service, 'update')
      .mockResolvedValue(input as unknown as Account);

    // THEN
    const account = await controller.activate(id);
    expect(account).toBeDefined();
    expect(account).toHaveProperty('balance', input.balance);
  });

  it('should deactivate an account', async () => {
    // GIVEN
    const id = '1';

    // WHEN
    jest
      .spyOn(service, 'update')
      .mockResolvedValue(input as unknown as Account);

    // THEN
    const account = await controller.deactivate(id);
    expect(account).toBeDefined();
    expect(account).toHaveProperty('balance', input.balance);
  });

  it('should do a deposit', async () => {
    // GIVEN
    const dto = {
      amount: 100,
      toAccountId: '1',
    } as TransactionDto;

    // WHEN
    jest.spyOn(service, 'deposit').mockResolvedValue({
      id: '1',
      amount: dto.amount,
      toAccountId: dto.toAccountId,
      fromAccountId: null,
      createdAt: new Date(),
    } as Transaction);

    // THEN
    const transaction = await controller.deposit(dto);
    expect(transaction).toBeDefined();
    expect(transaction).toHaveProperty('amount', dto.amount);
  });

  it('should not do a deposit if account does not exist', async () => {
    // GIVEN
    const dto = {
      amount: 100,
      toAccountId: 'non-existent',
    } as TransactionDto;

    // WHEN
    jest
      .spyOn(service, 'deposit')
      .mockRejectedValue(new Error('Account not found'));

    // THEN
    await expect(controller.deposit(dto)).rejects.toThrow('Account not found');
  });

  it('should do a withdrawal', async () => {
    // GIVEN
    const dto = {
      amount: 100,
      fromAccountId: '1',
    } as TransactionDto;

    // WHEN
    jest.spyOn(service, 'withdraw').mockResolvedValue({
      id: '1',
      amount: dto.amount,
      toAccountId: null,
      fromAccountId: dto.fromAccountId,
      createdAt: new Date(),
    } as Transaction);

    // THEN
    const transaction = await controller.withdraw(dto);
    expect(transaction).toBeDefined();
    expect(transaction).toHaveProperty('amount', dto.amount);
  });

  it('should not do a withdrawal if account does not exist', async () => {
    // GIVEN
    const dto = {
      amount: 100,
      fromAccountId: 'non-existent',
    } as TransactionDto;

    // WHEN
    jest
      .spyOn(service, 'withdraw')
      .mockRejectedValue(new Error('Account not found'));

    // THEN
    await expect(controller.withdraw(dto)).rejects.toThrow('Account not found');
  });
});
