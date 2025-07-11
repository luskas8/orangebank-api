import { PrismaService } from '@database/prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Account } from '@prisma/client';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';

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
});
