import { Test, TestingModule } from '@nestjs/testing';
import { Account } from '@prisma/client';
import { PrismaService } from '../database/prisma/prisma.service';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';

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

describe('AccountService', () => {
  let service: AccountService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      account: {
        create: jest.fn().mockResolvedValue(mockAccount),
        findUnique: jest.fn().mockResolvedValue(mockAccount),
        findMany: jest.fn(),
        update: jest.fn().mockResolvedValue(mockAccount),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an account successfully', async () => {
      // GIVEN
      const input: CreateAccountDto = {
        balance: 1000,
        type: 'current_account',
        active: true,
        userId: 1,
      };

      // WHEN
      const account = await service.create(input);

      // THEN
      expect(account).toBeDefined();
      expect(account).toEqual(mockAccount);
      expect(prismaService.account.create).toHaveBeenCalledWith({
        data: input,
      });
    });

    it('should return null when account creation fails', async () => {
      // GIVEN
      const input: CreateAccountDto = {
        balance: 1000,
        type: 'current_account',
        active: true,
        userId: 1,
      };
      jest
        .spyOn(prismaService.account, 'create')
        .mockRejectedValue(new Error('Database error'));

      // WHEN
      const account = await service.create(input);

      // THEN
      expect(account).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should find one account', async () => {
      // GIVEN
      const id = '1';

      // WHEN
      const account = await service.findOne(id);

      // THEN
      expect(account).toBeDefined();
      expect(account).toEqual(mockAccount);
      expect(prismaService.account.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });

    it('should return null if account not found', async () => {
      // GIVEN
      const id = 'non-existent-id';
      jest.spyOn(prismaService.account, 'findUnique').mockResolvedValue(null);

      // WHEN
      const account = await service.findOne(id);

      // THEN
      expect(account).toBeNull();
      expect(prismaService.account.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('findByUser', () => {
    it('should find accounts by user successfully', async () => {
      // GIVEN
      const userId = 1;
      const mockAccounts = [mockAccount, { ...mockAccount, id: '2' }];
      jest
        .spyOn(prismaService.account, 'findMany')
        .mockResolvedValue(mockAccounts);

      // WHEN
      const accounts = await service.findByUser(userId);

      // THEN
      expect(accounts).toBeDefined();
      expect(accounts).toEqual(mockAccounts);
      expect(prismaService.account.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return null if no accounts found for user', async () => {
      // GIVEN
      const userId = 999;
      jest.spyOn(prismaService.account, 'findMany').mockResolvedValue([]);

      // WHEN
      const accounts = await service.findByUser(userId);

      // THEN
      expect(accounts).toBeNull();
      expect(prismaService.account.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return null if findMany returns null', async () => {
      // GIVEN
      const userId = 999;
      jest
        .spyOn(prismaService.account, 'findMany')
        .mockResolvedValue(null as any);

      // WHEN
      const accounts = await service.findByUser(userId);

      // THEN
      expect(accounts).toBeNull();
      expect(prismaService.account.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe('update', () => {
    it('should activate an account', async () => {
      // GIVEN
      const id = '1';
      const activatedAccount = { ...mockAccount, active: true };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockAccount);
      jest
        .spyOn(prismaService.account, 'update')
        .mockResolvedValue(activatedAccount);

      // WHEN
      const result = await service.update(id, true);

      // THEN
      expect(result).toBeDefined();
      expect(result?.active).toEqual(true);
      expect(prismaService.account.update).toHaveBeenCalledWith({
        where: { id },
        data: { active: true },
      });
    });

    it('should deactivate an account', async () => {
      // GIVEN
      const id = '1';
      const deactivatedAccount = { ...mockAccount, active: false };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockAccount);
      jest
        .spyOn(prismaService.account, 'update')
        .mockResolvedValue(deactivatedAccount);

      // WHEN
      const result = await service.update(id, false);

      // THEN
      expect(result).toBeDefined();
      expect(result?.active).toEqual(false);
      expect(prismaService.account.update).toHaveBeenCalledWith({
        where: { id },
        data: { active: false },
      });
    });

    it('should return null if account not found', async () => {
      // GIVEN
      const id = 'non-existent-id';
      jest.spyOn(service, 'findOne').mockResolvedValue(null);

      // WHEN
      const result = await service.update(id, true);

      // THEN
      expect(result).toBeNull();
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });
});
