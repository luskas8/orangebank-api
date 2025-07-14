import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  FixedIncome,
  Account,
  Transaction,
  TransactionType,
  AccountType,
} from '@prisma/client';
import { PrismaService } from '@src/database/prisma/prisma.service';
import { FixedIncomeService } from './fixed-income.service';
import { BuyAssetDto } from '../dto/buy-asset.dto';
import { SellAssetDto } from '../dto/sell-asset.dto';

const mockFixedIncome: FixedIncome = {
  id: 'CDB001',
  name: 'CDB Banco ABC',
  type: 'CDB',
  rate: 12.5,
  rateType: 'annual',
  maturity: new Date('2026-07-13T00:00:00Z'),
  minimumInvestment: 1000,
  createdAt: new Date('2025-07-13T00:00:00Z'),
  updatedAt: new Date('2025-07-13T00:00:00Z'),
};

const mockInvestmentAccount: Account = {
  id: 'investment-account-1',
  userId: 1,
  active: true,
  balance: 5000,
  type: AccountType.investment_account,
  createdAt: new Date('2025-07-13T00:00:00Z'),
  updatedAt: new Date('2025-07-13T00:00:00Z'),
  pendingTransaction: false,
  portfolioId: null,
};

const mockTransaction: Transaction = {
  id: 'transaction-1',
  fromAccountId: 'investment-account-1',
  toAccountId: null,
  amount: 1000,
  type: TransactionType.asset_purchase,
  description: 'Purchase of 1000 CDB001 units at $1.00 each',
  createdAt: new Date('2025-07-13T00:00:00Z'),
  updatedAt: new Date('2025-07-13T00:00:00Z'),
  category: 'investment',
};

describe('FixedIncomeService', () => {
  let service: FixedIncomeService;
  let prismaService: any;

  const userId = 1;

  beforeEach(async () => {
    const mockPrismaService = {
      fixedIncome: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      account: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      transaction: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FixedIncomeService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FixedIncomeService>(FixedIncomeService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllFixedIncomes', () => {
    it('should return all fixed incomes successfully', async () => {
      // GIVEN
      const expectedFixedIncomes = [mockFixedIncome];
      prismaService.fixedIncome.findMany.mockResolvedValue(
        expectedFixedIncomes,
      );

      // WHEN
      const result = await service.getAllFixedIncomes();

      // THEN
      expect(result).toEqual(expectedFixedIncomes);
      expect(prismaService.fixedIncome.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getFixedIncome', () => {
    it('should return fixed income by id successfully', async () => {
      // GIVEN
      const id = 'CDB001';
      prismaService.fixedIncome.findUnique.mockResolvedValue(mockFixedIncome);

      // WHEN
      const result = await service.getFixedIncome(id);

      // THEN
      expect(result).toEqual(mockFixedIncome);
      expect(prismaService.fixedIncome.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });

    it('should return null when fixed income not found', async () => {
      // GIVEN
      const id = 'NONEXISTENT';
      prismaService.fixedIncome.findUnique.mockResolvedValue(null);

      // WHEN
      const result = await service.getFixedIncome(id);

      // THEN
      expect(result).toBeNull();
      expect(prismaService.fixedIncome.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('buyFixedIncome', () => {
    const buyAssetDto: BuyAssetDto = {
      assetSymbol: 'CDB001',
      quantity: 1000, // Valor investido em reais
    };

    it('should buy fixed income successfully', async () => {
      // GIVEN
      prismaService.fixedIncome.findUnique.mockResolvedValue(mockFixedIncome);
      prismaService.account.findFirst.mockResolvedValue(mockInvestmentAccount);

      let capturedBalanceUpdate: any;
      let capturedTransactionCall: any;
      prismaService.$transaction.mockImplementation(async (callback: any) => {
        const mockPrisma = {
          account: {
            update: jest.fn().mockImplementation((params) => {
              // Captura apenas a chamada que atualiza o balance (segunda chamada)
              if (params.data.balance !== undefined) {
                capturedBalanceUpdate = params;
              }
              return Promise.resolve({
                ...mockInvestmentAccount,
                ...params.data,
              });
            }),
          },
          transaction: {
            create: jest.fn().mockImplementation((params) => {
              capturedTransactionCall = params;
              return { ...mockTransaction, ...params.data };
            }),
          },
        };
        return callback(mockPrisma);
      });

      // WHEN
      const result = await service.buyFixedIncome(userId, buyAssetDto);

      // THEN
      expect(result).toEqual(
        expect.objectContaining({
          type: TransactionType.asset_purchase,
          amount: 1000,
        }),
      );
      expect(capturedBalanceUpdate.data.balance).toBe(4000); // 5000 - 1000
      expect(capturedTransactionCall.data.amount).toBe(1000);
    });

    it('should throw NotFoundException when fixed income not found', async () => {
      // GIVEN
      prismaService.fixedIncome.findUnique.mockResolvedValue(null);

      // WHEN & THEN
      await expect(service.buyFixedIncome(userId, buyAssetDto)).rejects.toThrow(
        new NotFoundException('Fixed income asset CDB001 not found'),
      );
    });

    it('should throw NotFoundException when investment account not found', async () => {
      // GIVEN
      prismaService.fixedIncome.findUnique.mockResolvedValue(mockFixedIncome);
      prismaService.account.findFirst.mockResolvedValue(null);

      // WHEN & THEN
      await expect(service.buyFixedIncome(userId, buyAssetDto)).rejects.toThrow(
        new NotFoundException('Investment account not found or inactive'),
      );
    });

    it('should throw BadRequestException when investment amount is below minimum', async () => {
      // GIVEN
      const smallBuyDto: BuyAssetDto = {
        assetSymbol: 'CDB001',
        quantity: 500, // Abaixo do mínimo de 1000
      };
      prismaService.fixedIncome.findUnique.mockResolvedValue(mockFixedIncome);
      prismaService.account.findFirst.mockResolvedValue(mockInvestmentAccount);

      // WHEN & THEN
      await expect(service.buyFixedIncome(userId, smallBuyDto)).rejects.toThrow(
        new BadRequestException('Minimum investment for CDB001 is $1000'),
      );
    });

    it('should throw BadRequestException when insufficient balance', async () => {
      // GIVEN
      const insufficientBalanceAccount = {
        ...mockInvestmentAccount,
        balance: 500,
      };
      prismaService.fixedIncome.findUnique.mockResolvedValue(mockFixedIncome);
      prismaService.account.findFirst.mockResolvedValue(
        insufficientBalanceAccount,
      );

      // WHEN & THEN
      await expect(service.buyFixedIncome(userId, buyAssetDto)).rejects.toThrow(
        new BadRequestException('Insufficient balance in investment account'),
      );
    });

    it('should throw BadRequestException when account has pending transaction', async () => {
      // GIVEN
      const pendingTransactionAccount = {
        ...mockInvestmentAccount,
        pendingTransaction: true,
      };
      prismaService.fixedIncome.findUnique.mockResolvedValue(mockFixedIncome);
      prismaService.account.findFirst.mockResolvedValue(
        pendingTransactionAccount,
      );

      // WHEN & THEN
      await expect(service.buyFixedIncome(userId, buyAssetDto)).rejects.toThrow(
        new BadRequestException(
          'There is a pending transaction on this account',
        ),
      );
    });

    it('should throw BadRequestException when account is inactive', async () => {
      // GIVEN
      prismaService.fixedIncome.findUnique.mockResolvedValue(mockFixedIncome);
      prismaService.account.findFirst.mockResolvedValue(null); // Conta inativa não é encontrada

      // WHEN & THEN
      await expect(service.buyFixedIncome(userId, buyAssetDto)).rejects.toThrow(
        new NotFoundException('Investment account not found or inactive'),
      );
    });
  });

  describe('sellFixedIncome', () => {
    const sellAssetDto: SellAssetDto = {
      assetSymbol: 'CDB001',
      quantity: 500, // Valor a ser resgatado
    };

    it('should sell fixed income successfully', async () => {
      // GIVEN
      prismaService.fixedIncome.findUnique.mockResolvedValue(mockFixedIncome);
      prismaService.account.findFirst.mockResolvedValue(mockInvestmentAccount);

      let capturedUpdateCall: any;
      let capturedTransactionCall: any;
      prismaService.$transaction.mockImplementation(async (callback: any) => {
        const mockPrisma = {
          account: {
            update: jest.fn().mockImplementation((params) => {
              capturedUpdateCall = params;
              return Promise.resolve({
                ...mockInvestmentAccount,
                balance: params.data.balance,
              });
            }),
          },
          transaction: {
            create: jest.fn().mockImplementation((params) => {
              capturedTransactionCall = params;
              return { ...mockTransaction, ...params.data };
            }),
          },
        };
        return callback(mockPrisma);
      });

      // WHEN
      const result = await service.sellFixedIncome(userId, sellAssetDto);

      // THEN
      expect(result).toEqual(
        expect.objectContaining({
          type: TransactionType.asset_sale,
        }),
      );
      expect(capturedUpdateCall).toBeDefined();
      expect(capturedTransactionCall).toBeDefined();
    });

    it('should throw NotFoundException when fixed income not found', async () => {
      // GIVEN
      prismaService.fixedIncome.findUnique.mockResolvedValue(null);

      // WHEN & THEN
      await expect(
        service.sellFixedIncome(userId, sellAssetDto),
      ).rejects.toThrow(
        new NotFoundException('Fixed income asset CDB001 not found'),
      );
    });

    it('should throw NotFoundException when investment account not found', async () => {
      // GIVEN
      prismaService.fixedIncome.findUnique.mockResolvedValue(mockFixedIncome);
      prismaService.account.findFirst.mockResolvedValue(null);

      // WHEN & THEN
      await expect(
        service.sellFixedIncome(userId, sellAssetDto),
      ).rejects.toThrow(
        new NotFoundException('Investment account not found or inactive'),
      );
    });

    it('should throw BadRequestException when account is inactive', async () => {
      // GIVEN
      prismaService.fixedIncome.findUnique.mockResolvedValue(mockFixedIncome);
      prismaService.account.findFirst.mockResolvedValue(null); // Conta inativa não é encontrada

      // WHEN & THEN
      await expect(
        service.sellFixedIncome(userId, sellAssetDto),
      ).rejects.toThrow(
        new NotFoundException('Investment account not found or inactive'),
      );
    });

    it('should throw BadRequestException when account has pending transaction', async () => {
      // GIVEN
      const pendingTransactionAccount = {
        ...mockInvestmentAccount,
        pendingTransaction: true,
      };
      prismaService.fixedIncome.findUnique.mockResolvedValue(mockFixedIncome);
      prismaService.account.findFirst.mockResolvedValue(
        pendingTransactionAccount,
      );

      // WHEN & THEN
      await expect(
        service.sellFixedIncome(userId, sellAssetDto),
      ).rejects.toThrow(
        new BadRequestException(
          'There is a pending transaction on this account',
        ),
      );
    });

    it('should calculate correct tax amount', async () => {
      // GIVEN
      const quantity = 500; // Principal amount invested
      const timeFactorMonths = 6; // 6 months investment
      const yearlyRate = mockFixedIncome.rate / 100; // 12.5% -> 0.125
      const monthlyRate = yearlyRate / 12; // Monthly rate
      const grossAmount = quantity * (1 + monthlyRate * timeFactorMonths);
      const profit = grossAmount - quantity;
      const taxAmount = profit > 0 ? profit * 0.22 : 0; // 22% tax
      const netAmount = grossAmount - taxAmount;

      prismaService.fixedIncome.findUnique.mockResolvedValue(mockFixedIncome);
      prismaService.account.findFirst.mockResolvedValue(mockInvestmentAccount);

      let capturedBalanceUpdate: any;
      let capturedTransactionCall: any;
      prismaService.$transaction.mockImplementation(async (callback: any) => {
        const mockPrisma = {
          account: {
            update: jest.fn().mockImplementation((params) => {
              // Captura apenas a chamada que atualiza o balance
              if (params.data.balance !== undefined) {
                capturedBalanceUpdate = params;
              }
              return Promise.resolve({
                ...mockInvestmentAccount,
                ...params.data,
              });
            }),
          },
          transaction: {
            create: jest.fn().mockImplementation((params) => {
              capturedTransactionCall = params;
              return { ...mockTransaction, ...params.data };
            }),
          },
        };
        return callback(mockPrisma);
      });

      // WHEN
      await service.sellFixedIncome(userId, sellAssetDto);

      // THEN
      expect(capturedBalanceUpdate.data.balance).toBeCloseTo(
        mockInvestmentAccount.balance + netAmount,
        1,
      );
      expect(capturedTransactionCall.data.amount).toBeCloseTo(netAmount, 1);
    });
  });
});
