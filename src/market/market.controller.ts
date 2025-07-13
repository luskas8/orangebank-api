import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FixedIncome, Stock, Transaction } from '@prisma/client';
import { GetUser } from '@src/auth/decorators/get-user.decorator';
import { LoggedInUser } from '@src/auth/dto/logged-in-user.dto';
import { ErrorResponseDto } from '@src/common/dto/error-response.dto';
import {
  AssetTransactionResponseDto,
  FixedIncomeResponseDto,
  StockResponseDto,
} from './dto/asset-response.dto';
import { BuyAssetDto } from './dto/buy-asset.dto';
import { SellAssetDto } from './dto/sell-asset.dto';
import { FixedIncomeService } from './fixed-income/fixed-income.service';
import { StockService } from './stock/stock.service';

@UseGuards(JwtAuthGuard)
@ApiTags('Market')
@Controller('market')
@ApiBearerAuth('JWT-auth')
export class MarketController {
  private readonly logger = new Logger(MarketController.name);

  constructor(
    private readonly stockService: StockService,
    private readonly fixedIncomeService: FixedIncomeService,
  ) {}

  @Get('stocks')
  @ApiOperation({
    summary: 'Get all available stocks',
    description: 'Retrieves a list of all stocks available for trading.',
  })
  @ApiResponse({
    status: 200,
    description: 'Stocks retrieved successfully',
    type: [StockResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ErrorResponseDto,
  })
  async getAllStocks(): Promise<Stock[]> {
    try {
      return await this.stockService.getAllStocks();
    } catch (error) {
      this.logger.error('Failed to retrieve stocks', error);
      throw new BadRequestException('Failed to retrieve stocks');
    }
  }

  @Get('fixed-incomes')
  @ApiOperation({
    summary: 'Get all available fixed income assets',
    description:
      'Retrieves a list of all fixed income assets available for investment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Fixed income assets retrieved successfully',
    type: [FixedIncomeResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ErrorResponseDto,
  })
  async getAllFixedIncomes(): Promise<FixedIncome[]> {
    try {
      return await this.fixedIncomeService.getAllFixedIncomes();
    } catch (error) {
      this.logger.error('Failed to retrieve fixed income assets', error);
      throw new BadRequestException('Failed to retrieve fixed income assets');
    }
  }

  @Post('buy/stock')
  @ApiOperation({
    summary: 'Buy stocks',
    description:
      'Purchase stocks using the investment account. Applies 1% brokerage fee. Requires sufficient balance in the investment account.',
  })
  @ApiResponse({
    status: 201,
    description: 'Stock purchase completed successfully',
    type: AssetTransactionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Purchase failed - Insufficient balance or invalid data',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 400,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/market/buy/stock',
        method: 'POST',
        error: 'INSUFFICIENT_BALANCE',
        message: 'Insufficient balance in investment account',
        details: {
          type: 'INSUFFICIENT_BALANCE',
          cause: 'Investment account balance is lower than required amount',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Stock not found or investment account not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ErrorResponseDto,
  })
  async buyStock(
    @GetUser() user: LoggedInUser,
    @Body(ValidationPipe) buyAssetDto: BuyAssetDto,
  ): Promise<Transaction> {
    try {
      const transaction = await this.stockService.buyStock(
        user.id,
        buyAssetDto,
      );
      this.logger.log(
        `User ${user.id} purchased ${buyAssetDto.quantity} shares of ${buyAssetDto.assetSymbol}`,
      );
      return transaction;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Failed to buy stock for user ${user.id}`, error);
      throw new BadRequestException('Failed to complete stock purchase');
    }
  }

  @Post('sell/stock')
  @ApiOperation({
    summary: 'Sell stocks',
    description:
      'Sell stocks from the investment account. Applies 15% tax on profits. The net amount is credited to the investment account.',
  })
  @ApiResponse({
    status: 201,
    description: 'Stock sale completed successfully',
    type: AssetTransactionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Sale failed - Invalid data or pending transactions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Stock not found or investment account not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ErrorResponseDto,
  })
  async sellStock(
    @GetUser() user: LoggedInUser,
    @Body(ValidationPipe) sellAssetDto: SellAssetDto,
  ): Promise<Transaction> {
    try {
      const transaction = await this.stockService.sellStock(
        user.id,
        sellAssetDto,
      );
      this.logger.log(
        `User ${user.id} sold ${sellAssetDto.quantity} shares of ${sellAssetDto.assetSymbol}`,
      );
      return transaction;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Failed to sell stock for user ${user.id}`, error);
      throw new BadRequestException('Failed to complete stock sale');
    }
  }

  @Post('buy/fixed-income')
  @ApiOperation({
    summary: 'Buy fixed income assets',
    description:
      'Invest in fixed income assets (CDB, Tesouro Direto) using the investment account. Requires sufficient balance and minimum investment amount.',
  })
  @ApiResponse({
    status: 201,
    description: 'Fixed income investment completed successfully',
    type: AssetTransactionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Investment failed - Insufficient balance, below minimum investment, or invalid data',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 400,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/market/buy/fixed-income',
        method: 'POST',
        error: 'MINIMUM_INVESTMENT_NOT_MET',
        message: 'Minimum investment for CDB001 is $1000',
        details: {
          type: 'MINIMUM_INVESTMENT_NOT_MET',
          cause: 'Investment amount is below the minimum required',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Fixed income asset not found or investment account not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ErrorResponseDto,
  })
  async buyFixedIncome(
    @GetUser() user: LoggedInUser,
    @Body(ValidationPipe) buyAssetDto: BuyAssetDto,
  ): Promise<Transaction> {
    try {
      const transaction = await this.fixedIncomeService.buyFixedIncome(
        user.id,
        buyAssetDto,
      );
      this.logger.log(
        `User ${user.id} invested $${buyAssetDto.quantity} in ${buyAssetDto.assetSymbol}`,
      );
      return transaction;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to buy fixed income for user ${user.id}`,
        error,
      );
      throw new BadRequestException(
        'Failed to complete fixed income investment',
      );
    }
  }

  @Post('sell/fixed-income')
  @ApiOperation({
    summary: 'Redeem fixed income assets',
    description:
      'Redeem fixed income investments. Applies 22% tax on profits. The net amount is credited to the investment account.',
  })
  @ApiResponse({
    status: 201,
    description: 'Fixed income redemption completed successfully',
    type: AssetTransactionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Redemption failed - Invalid data or pending transactions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Fixed income asset not found or investment account not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ErrorResponseDto,
  })
  async sellFixedIncome(
    @GetUser() user: LoggedInUser,
    @Body(ValidationPipe) sellAssetDto: SellAssetDto,
  ): Promise<Transaction> {
    try {
      const transaction = await this.fixedIncomeService.sellFixedIncome(
        user.id,
        sellAssetDto,
      );
      this.logger.log(
        `User ${user.id} redeemed $${sellAssetDto.quantity} from ${sellAssetDto.assetSymbol}`,
      );
      return transaction;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to sell fixed income for user ${user.id}`,
        error,
      );
      throw new BadRequestException(
        'Failed to complete fixed income redemption',
      );
    }
  }
}
