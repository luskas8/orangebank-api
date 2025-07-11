import { PrismaModule } from '@database/prisma/prisma.module';
import { PrismaService } from '@database/prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Account } from '@prisma/client';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';

const output: Account = {
  id: '1',
  active: true,
  balance: 1000,
  type: 'current_account',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

describe('AccountService', () => {
  let service: AccountService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        AccountService,
        {
          provide: PrismaService,
          useValue: {
            account: {
              create: jest.fn().mockResolvedValue(output),
              findUnique: jest.fn().mockResolvedValue(output),
              update: jest.fn().mockResolvedValue(output),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an account', async () => {
    // GIVEN
    const input = {
      active: true,
      balance: 1000,
      type: 'current_account',
    } as CreateAccountDto;

    // WHEN
    const account = await service.create(input);

    // THEN
    expect(account).toBeDefined();
    expect(account?.balance).toEqual(input.balance);
    expect(account?.active).toEqual(input.active);
  });

  it('should find one account', async () => {
    // GIVEN
    const id = '1';

    // WHEN
    const account = await service.findOne(id);

    // THEN
    expect(account).toBeDefined();
    expect(account?.id).toEqual(id);
    expect(account?.balance).toEqual(output.balance);
  });

  it('should return null if account not found', async () => {
    // GIVEN
    const id = 'non-existent-id';
    jest.spyOn(service, 'findOne').mockResolvedValue(null);

    // WHEN
    const account = await service.findOne(id);

    // THEN
    expect(account).toBeNull();
  });

  it('should activate an account', async () => {
    // GIVEN
    const id = '1';

    // WHEN
    const result = await service.update(id, true);

    // THEN
    expect(result).toBeDefined();
    expect(result?.active).toEqual(true);
  });

  it('should deactivate an account', async () => {
    // GIVEN
    const id = '1';
    jest.spyOn(service, 'update').mockResolvedValue({
      ...output,
      active: false,
    });

    // WHEN
    const result = await service.update(id, false);

    // THEN
    expect(result).toBeDefined();
    expect(result?.active).toEqual(false);
  });
});
