import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Stock, FixedIncome, Transaction } from '@prisma/client';
import { MarketController } from './market.controller';
import { StockService } from './stock/stock.service';
import { FixedIncomeService } from './fixed-income/fixed-income.service';
import { BuyAssetDto } from './dto/buy-asset.dto';
import { SellAssetDto } from './dto/sell-asset.dto';
import { LoggedInUser } from '@src/auth/dto/logged-in-user.dto';

const mockUser: LoggedInUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  password: 'password123',
  cpf: '12345678901',
  birthDate: '1990-01-01',
  createdAt: '2025-01-13T00:00:00Z',
  updatedAt: '2025-01-13T00:00:00Z',
};

const mockStock: Stock = {
  id: 'AAPL',
  name: 'Apple Inc.',
  sector: 'Technology',
  currentPrice: 150.25,
  dailyVariation: 2.5,
  createdAt: new Date('2025-07-13T00:00:00Z'),
  updatedAt: new Date('2025-07-13T00:00:00Z'),
};

const mockFixedIncome: FixedIncome = {
  id: 'CDB001',
  name: 'CDB Banco XYZ',
  type: 'cdb',
  rate: 12.5,
  rateType: 'pre',
  maturity: new Date('2026-07-13T00:00:00Z'),
  minimumInvestment: 1000.0,
  createdAt: new Date('2025-07-13T00:00:00Z'),
  updatedAt: new Date('2025-07-13T00:00:00Z'),
};

const mockTransaction: Transaction = {
  id: 'transaction-1',
  fromAccountId: 'account-1',
  toAccountId: null,
  amount: 1502.5,
  type: 'asset_purchase',
  description: 'Purchase of 10 AAPL shares',
  createdAt: new Date('2025-07-13T00:00:00Z'),
  updatedAt: new Date('2025-07-13T00:00:00Z'),
};

describe('MarketController', () => {
  let controller: MarketController;
  let stockService: jest.Mocked<StockService>;
  let fixedIncomeService: jest.Mocked<FixedIncomeService>;

  beforeEach(async () => {
    const mockStockService = {
      getAllStocks: jest.fn(),
      buyStock: jest.fn(),
      sellStock: jest.fn(),
    };

    const mockFixedIncomeService = {
      getAllFixedIncomes: jest.fn(),
      buyFixedIncome: jest.fn(),
      sellFixedIncome: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketController],
      providers: [
        {
          provide: StockService,
          useValue: mockStockService,
        },
        {
          provide: FixedIncomeService,
          useValue: mockFixedIncomeService,
        },
      ],
    }).compile();

    controller = module.get<MarketController>(MarketController);
    stockService = module.get(StockService);
    fixedIncomeService = module.get(FixedIncomeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllStocks', () => {
    it('should return all stocks successfully', async () => {
      // GIVEN
      const expectedStocks = [mockStock];
      stockService.getAllStocks.mockResolvedValue(expectedStocks);

      // WHEN
      const result = await controller.getAllStocks();

      // THEN
      expect(result).toEqual(expectedStocks);
      expect(stockService.getAllStocks).toHaveBeenCalled();
    });

    it('should throw BadRequestException when service fails', async () => {
      // GIVEN
      stockService.getAllStocks.mockRejectedValue(new Error('Database error'));

      // WHEN & THEN
      await expect(controller.getAllStocks()).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getAllFixedIncomes', () => {
    it('should return all fixed income assets successfully', async () => {
      // GIVEN
      const expectedFixedIncomes = [mockFixedIncome];
      fixedIncomeService.getAllFixedIncomes.mockResolvedValue(
        expectedFixedIncomes,
      );

      // WHEN
      const result = await controller.getAllFixedIncomes();

      // THEN
      expect(result).toEqual(expectedFixedIncomes);
      expect(fixedIncomeService.getAllFixedIncomes).toHaveBeenCalled();
    });

    it('should throw BadRequestException when service fails', async () => {
      // GIVEN
      fixedIncomeService.getAllFixedIncomes.mockRejectedValue(
        new Error('Database error'),
      );

      // WHEN & THEN
      await expect(controller.getAllFixedIncomes()).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('buyStock', () => {
    const buyAssetDto: BuyAssetDto = {
      assetSymbol: 'AAPL',
      quantity: 10,
    };

    it('should buy stock successfully', async () => {
      // GIVEN
      stockService.buyStock.mockResolvedValue(mockTransaction);

      // WHEN
      const result = await controller.buyStock(mockUser, buyAssetDto);

      // THEN
      expect(result).toEqual(mockTransaction);
      expect(stockService.buyStock).toHaveBeenCalledWith(
        mockUser.id,
        buyAssetDto,
      );
    });

    it('should propagate NotFoundException from service', async () => {
      // GIVEN
      stockService.buyStock.mockRejectedValue(
        new NotFoundException('Stock not found'),
      );

      // WHEN & THEN
      await expect(controller.buyStock(mockUser, buyAssetDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should propagate BadRequestException from service', async () => {
      // GIVEN
      stockService.buyStock.mockRejectedValue(
        new BadRequestException('Insufficient balance'),
      );

      // WHEN & THEN
      await expect(controller.buyStock(mockUser, buyAssetDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for unexpected errors', async () => {
      // GIVEN
      stockService.buyStock.mockRejectedValue(new Error('Unexpected error'));

      // WHEN & THEN
      await expect(controller.buyStock(mockUser, buyAssetDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('sellStock', () => {
    const sellAssetDto: SellAssetDto = {
      assetSymbol: 'AAPL',
      quantity: 5,
    };

    it('should sell stock successfully', async () => {
      // GIVEN
      const sellTransaction = { ...mockTransaction, type: 'asset_sale' };
      stockService.sellStock.mockResolvedValue(sellTransaction as Transaction);

      // WHEN
      const result = await controller.sellStock(mockUser, sellAssetDto);

      // THEN
      expect(result).toEqual(sellTransaction);
      expect(stockService.sellStock).toHaveBeenCalledWith(
        mockUser.id,
        sellAssetDto,
      );
    });

    it('should propagate NotFoundException from service', async () => {
      // GIVEN
      stockService.sellStock.mockRejectedValue(
        new NotFoundException('Stock not found'),
      );

      // WHEN & THEN
      await expect(
        controller.sellStock(mockUser, sellAssetDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate BadRequestException from service', async () => {
      // GIVEN
      stockService.sellStock.mockRejectedValue(
        new BadRequestException('Pending transaction'),
      );

      // WHEN & THEN
      await expect(
        controller.sellStock(mockUser, sellAssetDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for unexpected errors', async () => {
      // GIVEN
      stockService.sellStock.mockRejectedValue(new Error('Unexpected error'));

      // WHEN & THEN
      await expect(
        controller.sellStock(mockUser, sellAssetDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('buyFixedIncome', () => {
    const buyAssetDto: BuyAssetDto = {
      assetSymbol: 'CDB001',
      quantity: 5000, // Investment amount
    };

    it('should buy fixed income successfully', async () => {
      // GIVEN
      fixedIncomeService.buyFixedIncome.mockResolvedValue(mockTransaction);

      // WHEN
      const result = await controller.buyFixedIncome(mockUser, buyAssetDto);

      // THEN
      expect(result).toEqual(mockTransaction);
      expect(fixedIncomeService.buyFixedIncome).toHaveBeenCalledWith(
        mockUser.id,
        buyAssetDto,
      );
    });

    it('should propagate NotFoundException from service', async () => {
      // GIVEN
      fixedIncomeService.buyFixedIncome.mockRejectedValue(
        new NotFoundException('Fixed income asset not found'),
      );

      // WHEN & THEN
      await expect(
        controller.buyFixedIncome(mockUser, buyAssetDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate BadRequestException from service', async () => {
      // GIVEN
      fixedIncomeService.buyFixedIncome.mockRejectedValue(
        new BadRequestException('Minimum investment not met'),
      );

      // WHEN & THEN
      await expect(
        controller.buyFixedIncome(mockUser, buyAssetDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for unexpected errors', async () => {
      // GIVEN
      fixedIncomeService.buyFixedIncome.mockRejectedValue(
        new Error('Unexpected error'),
      );

      // WHEN & THEN
      await expect(
        controller.buyFixedIncome(mockUser, buyAssetDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('sellFixedIncome', () => {
    const sellAssetDto: SellAssetDto = {
      assetSymbol: 'CDB001',
      quantity: 5000, // Redemption amount
    };

    it('should sell fixed income successfully', async () => {
      // GIVEN
      const sellTransaction = { ...mockTransaction, type: 'asset_sale' };
      fixedIncomeService.sellFixedIncome.mockResolvedValue(
        sellTransaction as Transaction,
      );

      // WHEN
      const result = await controller.sellFixedIncome(mockUser, sellAssetDto);

      // THEN
      expect(result).toEqual(sellTransaction);
      expect(fixedIncomeService.sellFixedIncome).toHaveBeenCalledWith(
        mockUser.id,
        sellAssetDto,
      );
    });

    it('should propagate NotFoundException from service', async () => {
      // GIVEN
      fixedIncomeService.sellFixedIncome.mockRejectedValue(
        new NotFoundException('Fixed income asset not found'),
      );

      // WHEN & THEN
      await expect(
        controller.sellFixedIncome(mockUser, sellAssetDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate BadRequestException from service', async () => {
      // GIVEN
      fixedIncomeService.sellFixedIncome.mockRejectedValue(
        new BadRequestException('Pending transaction'),
      );

      // WHEN & THEN
      await expect(
        controller.sellFixedIncome(mockUser, sellAssetDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for unexpected errors', async () => {
      // GIVEN
      fixedIncomeService.sellFixedIncome.mockRejectedValue(
        new Error('Unexpected error'),
      );

      // WHEN & THEN
      await expect(
        controller.sellFixedIncome(mockUser, sellAssetDto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
