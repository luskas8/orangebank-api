import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  Stock,
  Account,
  Transaction,
  TransactionType,
  AccountType,
} from '@prisma/client';
import { PrismaService } from '@src/database/prisma/prisma.service';
import { StockService } from './stock.service';
import { BuyAssetDto } from '../dto/buy-asset.dto';
import { SellAssetDto } from '../dto/sell-asset.dto';

const mockStock: Stock = {
  id: 'AAPL',
  name: 'Apple Inc.',
  sector: 'Technology',
  currentPrice: 150.25,
  dailyVariation: 2.5,
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
  amount: 1502.5,
  type: TransactionType.asset_purchase,
  description:
    'Purchase of 10 AAPL shares at $150.25 each (Brokerage fee: $15.03)',
  createdAt: new Date('2025-07-13T00:00:00Z'),
  updatedAt: new Date('2025-07-13T00:00:00Z'),
  category: 'investment',
};

describe('StockService', () => {
  let service: StockService;
  let prismaService: any;

  beforeEach(async () => {
    const mockPrismaService = {
      stock: {
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
        StockService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllStocks', () => {
    it('should return all stocks successfully', async () => {
      // GIVEN
      const expectedStocks = [mockStock];
      prismaService.stock.findMany.mockResolvedValue(expectedStocks);

      // WHEN
      const result = await service.getAllStocks();

      // THEN
      expect(result).toEqual(expectedStocks);
      expect(prismaService.stock.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getStock', () => {
    it('should return stock by symbol successfully', async () => {
      // GIVEN
      const symbol = 'AAPL';
      prismaService.stock.findUnique.mockResolvedValue(mockStock);

      // WHEN
      const result = await service.getStock(symbol);

      // THEN
      expect(result).toEqual(mockStock);
      expect(prismaService.stock.findUnique).toHaveBeenCalledWith({
        where: { id: symbol },
      });
    });

    it('should return null when stock not found', async () => {
      // GIVEN
      const symbol = 'NONEXISTENT';
      prismaService.stock.findUnique.mockResolvedValue(null);

      // WHEN
      const result = await service.getStock(symbol);

      // THEN
      expect(result).toBeNull();
    });
  });

  describe('buyStock', () => {
    const buyAssetDto: BuyAssetDto = {
      assetSymbol: 'AAPL',
      quantity: 10,
    };
    const userId = 1;

    it('should buy stock successfully', async () => {
      // GIVEN
      prismaService.stock.findUnique.mockResolvedValue(mockStock);
      prismaService.account.findFirst.mockResolvedValue(mockInvestmentAccount);

      prismaService.$transaction.mockImplementation(async (callback: any) => {
        const mockPrisma = {
          account: {
            update: jest.fn(),
          },
          transaction: {
            create: jest.fn().mockResolvedValue(mockTransaction),
          },
        };
        return callback(mockPrisma);
      });

      // WHEN
      const result = await service.buyStock(userId, buyAssetDto);

      // THEN
      expect(result).toEqual(mockTransaction);
      expect(prismaService.stock.findUnique).toHaveBeenCalledWith({
        where: { id: buyAssetDto.assetSymbol },
      });
      expect(prismaService.account.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          type: AccountType.investment_account,
          active: true,
        },
      });
    });

    it('should throw NotFoundException when stock not found', async () => {
      // GIVEN
      prismaService.stock.findUnique.mockResolvedValue(null);

      // WHEN & THEN
      await expect(service.buyStock(userId, buyAssetDto)).rejects.toThrow(
        new NotFoundException('Stock AAPL not found'),
      );
    });

    it('should throw NotFoundException when investment account not found', async () => {
      // GIVEN
      prismaService.stock.findUnique.mockResolvedValue(mockStock);
      prismaService.account.findFirst.mockResolvedValue(null);

      // WHEN & THEN
      await expect(service.buyStock(userId, buyAssetDto)).rejects.toThrow(
        new NotFoundException('Investment account not found or inactive'),
      );
    });

    it('should throw BadRequestException when insufficient balance', async () => {
      // GIVEN
      const lowBalanceAccount = { ...mockInvestmentAccount, balance: 100 };
      prismaService.stock.findUnique.mockResolvedValue(mockStock);
      prismaService.account.findFirst.mockResolvedValue(lowBalanceAccount);

      // WHEN & THEN
      await expect(service.buyStock(userId, buyAssetDto)).rejects.toThrow(
        new BadRequestException('Insufficient balance in investment account'),
      );
    });

    it('should throw BadRequestException when account has pending transaction', async () => {
      // GIVEN
      const pendingTransactionAccount = {
        ...mockInvestmentAccount,
        pendingTransaction: true,
      };
      prismaService.stock.findUnique.mockResolvedValue(mockStock);
      prismaService.account.findFirst.mockResolvedValue(
        pendingTransactionAccount,
      );

      // WHEN & THEN
      await expect(service.buyStock(userId, buyAssetDto)).rejects.toThrow(
        new BadRequestException(
          'There is a pending transaction on this account',
        ),
      );
    });

    it('should calculate correct values with brokerage fee', async () => {
      // GIVEN
      const quantity = 10;
      const stockPrice = 150.25;
      const grossAmount = stockPrice * quantity; // 1502.5
      const brokerageFee = grossAmount * 0.01; // 15.025
      const totalCost = grossAmount + brokerageFee; // 1517.525

      prismaService.stock.findUnique.mockResolvedValue(mockStock);
      prismaService.account.findFirst.mockResolvedValue(mockInvestmentAccount);

      let capturedUpdateCall: any;
      let updateCallCount = 0;
      prismaService.$transaction.mockImplementation(async (callback: any) => {
        const mockPrisma = {
          account: {
            update: jest.fn().mockImplementation((params) => {
              updateCallCount++;
              if (updateCallCount === 2) {
                // Segunda chamada é a que atualiza o balance
                capturedUpdateCall = params;
              }
              return Promise.resolve({
                ...mockInvestmentAccount,
                balance: params.data.balance,
              });
            }),
          },
          transaction: {
            create: jest.fn().mockResolvedValue(mockTransaction),
          },
        };
        return callback(mockPrisma);
      });

      // WHEN
      await service.buyStock(userId, buyAssetDto);

      // THEN
      expect(capturedUpdateCall.data.balance).toBeCloseTo(
        mockInvestmentAccount.balance - totalCost,
        2,
      );
    });
  });

  describe('sellStock', () => {
    const sellAssetDto: SellAssetDto = {
      assetSymbol: 'AAPL',
      quantity: 5,
    };
    const userId = 1;

    it('should sell stock successfully', async () => {
      // GIVEN
      const sellTransaction = {
        ...mockTransaction,
        type: TransactionType.asset_sale,
      };
      prismaService.stock.findUnique.mockResolvedValue(mockStock);
      prismaService.account.findFirst.mockResolvedValue(mockInvestmentAccount);

      prismaService.$transaction.mockImplementation(async (callback: any) => {
        const mockPrisma = {
          account: {
            update: jest.fn(),
          },
          transaction: {
            create: jest.fn().mockResolvedValue(sellTransaction),
          },
        };
        return callback(mockPrisma);
      });

      // WHEN
      const result = await service.sellStock(userId, sellAssetDto);

      // THEN
      expect(result).toEqual(sellTransaction);
    });

    it('should throw NotFoundException when stock not found', async () => {
      // GIVEN
      prismaService.stock.findUnique.mockResolvedValue(null);

      // WHEN & THEN
      await expect(service.sellStock(userId, sellAssetDto)).rejects.toThrow(
        new NotFoundException('Stock AAPL not found'),
      );
    });

    it('should throw NotFoundException when investment account not found', async () => {
      // GIVEN
      prismaService.stock.findUnique.mockResolvedValue(mockStock);
      prismaService.account.findFirst.mockResolvedValue(null);

      // WHEN & THEN
      await expect(service.sellStock(userId, sellAssetDto)).rejects.toThrow(
        new NotFoundException('Investment account not found or inactive'),
      );
    });

    it('should throw BadRequestException when account has pending transaction', async () => {
      // GIVEN
      const pendingTransactionAccount = {
        ...mockInvestmentAccount,
        pendingTransaction: true,
      };
      prismaService.stock.findUnique.mockResolvedValue(mockStock);
      prismaService.account.findFirst.mockResolvedValue(
        pendingTransactionAccount,
      );

      // WHEN & THEN
      await expect(service.sellStock(userId, sellAssetDto)).rejects.toThrow(
        new BadRequestException(
          'There is a pending transaction on this account',
        ),
      );
    });

    it('should calculate correct tax amount', async () => {
      // GIVEN
      const quantity = 5;
      const currentPrice = 150.25;
      const grossAmount = currentPrice * quantity; // 751.25
      const assumedBuyPrice = currentPrice * 0.9; // 135.225 (10% profit assumed)
      const profit = (currentPrice - assumedBuyPrice) * quantity; // 75.125
      const taxAmount = profit * 0.15; // 11.27 (15% tax)
      const netAmount = grossAmount - taxAmount; // 739.98

      prismaService.stock.findUnique.mockResolvedValue(mockStock);
      prismaService.account.findFirst.mockResolvedValue(mockInvestmentAccount);

      let capturedUpdateCall: any;
      let capturedTransactionCall: any;
      let updateCallCount = 0;
      prismaService.$transaction.mockImplementation(async (callback: any) => {
        const mockPrisma = {
          account: {
            update: jest.fn().mockImplementation((params) => {
              updateCallCount++;
              if (updateCallCount === 2) {
                // Segunda chamada é a que atualiza o balance
                capturedUpdateCall = params;
              }
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
      await service.sellStock(userId, sellAssetDto);

      // THEN
      expect(capturedUpdateCall.data.balance).toBeCloseTo(
        mockInvestmentAccount.balance + netAmount,
        1,
      );
      expect(capturedTransactionCall.data.amount).toBeCloseTo(netAmount, 1);
    });
  });
});
