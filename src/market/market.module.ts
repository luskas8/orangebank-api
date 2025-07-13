import { Module } from '@nestjs/common';
import { StockService } from './stock/stock.service';
import { FixedIncomeService } from './fixed-income/fixed-income.service';
import { MarketController } from './market.controller';

@Module({
  providers: [StockService, FixedIncomeService],
  controllers: [MarketController],
})
export class MarketModule {}
