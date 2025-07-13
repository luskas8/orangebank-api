import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

export class StockResponseDto {
  @ApiProperty({
    description: 'Stock symbol',
    example: 'AAPL',
  })
  id: string;

  @ApiProperty({
    description: 'Stock name',
    example: 'Apple Inc.',
  })
  name: string;

  @ApiProperty({
    description: 'Stock sector',
    example: 'Technology',
  })
  sector: string;

  @ApiProperty({
    description: 'Current stock price',
    example: 150.25,
  })
  currentPrice: number;

  @ApiProperty({
    description: 'Daily price variation percentage',
    example: 2.5,
  })
  dailyVariation: number;

  @ApiProperty({
    description: 'Creation date',
    example: '2025-07-13T18:15:45.123Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2025-07-13T18:15:45.123Z',
  })
  updatedAt: Date;
}

export class FixedIncomeResponseDto {
  @ApiProperty({
    description: 'Fixed income asset ID',
    example: 'CDB001',
  })
  id: string;

  @ApiProperty({
    description: 'Fixed income asset name',
    example: 'CDB Banco XYZ',
  })
  name: string;

  @ApiProperty({
    description: 'Fixed income type',
    example: 'cdb',
  })
  type: string;

  @ApiProperty({
    description: 'Interest rate',
    example: 12.5,
  })
  rate: number;

  @ApiProperty({
    description: 'Rate type (pre or pos)',
    example: 'pre',
  })
  rateType: string;

  @ApiProperty({
    description: 'Maturity date',
    example: '2026-07-13T00:00:00.000Z',
  })
  maturity: Date;

  @ApiProperty({
    description: 'Minimum investment amount',
    example: 1000.0,
  })
  minimumInvestment: number;

  @ApiProperty({
    description: 'Creation date',
    example: '2025-07-13T18:15:45.123Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2025-07-13T18:15:45.123Z',
  })
  updatedAt: Date;
}

export class AssetTransactionResponseDto {
  @ApiProperty({
    description: 'Transaction ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Asset symbol/ID',
    example: 'AAPL',
  })
  assetSymbol: string;

  @ApiProperty({
    description: 'Quantity of assets bought/sold',
    example: 10,
  })
  quantity: number;

  @ApiProperty({
    description: 'Price per unit at transaction time',
    example: 150.25,
  })
  unitPrice: number;

  @ApiProperty({
    description: 'Total amount before fees and taxes',
    example: 1502.5,
  })
  grossAmount: number;

  @ApiProperty({
    description: 'Brokerage fee (for stocks)',
    example: 15.03,
  })
  brokerageFee?: number;

  @ApiProperty({
    description: 'Tax amount (for sales)',
    example: 22.54,
  })
  taxAmount?: number;

  @ApiProperty({
    description: 'Net amount after fees and taxes',
    example: 1464.93,
  })
  netAmount: number;

  @ApiProperty({
    description: 'Transaction type',
    example: 'asset_purchase',
    enum: TransactionType,
  })
  type: TransactionType;

  @ApiProperty({
    description: 'Transaction description',
    example: 'Purchase of 10 AAPL shares',
  })
  description: string;

  @ApiProperty({
    description: 'Account ID from where the transaction was made',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  accountId: string;

  @ApiProperty({
    description: 'Transaction date',
    example: '2025-07-13T18:15:45.123Z',
  })
  createdAt: Date;
}
