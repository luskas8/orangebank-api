import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountType,
  Stock,
  Transaction,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '@src/database/prisma/prisma.service';
import { BuyAssetDto } from '../dto/buy-asset.dto';
import { SellAssetDto } from '../dto/sell-asset.dto';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);
  private readonly BROKERAGE_FEE_RATE = 0.01; // 1%
  private readonly TAX_RATE = 0.15; // 15% for stocks

  constructor(private readonly prismaService: PrismaService) {}

  async getAllStocks(): Promise<Stock[]> {
    return this.prismaService.stock.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getStock(symbol: string): Promise<Stock | null> {
    return this.prismaService.stock.findUnique({
      where: { id: symbol },
    });
  }

  async buyStock(
    userId: number,
    buyAssetDto: BuyAssetDto,
  ): Promise<Transaction> {
    const { assetSymbol, quantity } = buyAssetDto;

    // Verificar se o stock existe
    const stock = await this.getStock(assetSymbol);
    if (!stock) {
      throw new NotFoundException(`Stock ${assetSymbol} not found`);
    }

    // Buscar conta de investimento do usuário
    const investmentAccount = await this.prismaService.account.findFirst({
      where: {
        userId,
        type: AccountType.investment_account,
        active: true,
      },
    });

    if (!investmentAccount) {
      throw new NotFoundException('Investment account not found or inactive');
    }

    // Calcular valores
    const grossAmount = stock.currentPrice * quantity;
    const brokerageFee = grossAmount * this.BROKERAGE_FEE_RATE;
    const totalCost = grossAmount + brokerageFee;

    // Verificar saldo suficiente
    if (investmentAccount.balance < totalCost) {
      throw new BadRequestException(
        'Insufficient balance in investment account',
      );
    }

    // Verificar se há transação pendente
    if (investmentAccount.pendingTransaction) {
      throw new BadRequestException(
        'There is a pending transaction on this account',
      );
    }

    // Executar transação
    return this.prismaService.$transaction(async (prisma) => {
      // Marcar conta como tendo transação pendente
      await prisma.account.update({
        where: { id: investmentAccount.id },
        data: { pendingTransaction: true },
      });

      try {
        // Debitar valor da conta
        await prisma.account.update({
          where: { id: investmentAccount.id },
          data: {
            balance: investmentAccount.balance - totalCost,
          },
        });

        // Criar transação
        const transaction = await prisma.transaction.create({
          data: {
            fromAccountId: investmentAccount.id,
            amount: totalCost,
            type: TransactionType.asset_purchase,
            description: `Purchase of ${quantity} ${assetSymbol} shares at $${stock.currentPrice} each (Brokerage fee: $${brokerageFee.toFixed(2)})`,
          },
        });

        // Remover flag de transação pendente
        await prisma.account.update({
          where: { id: investmentAccount.id },
          data: { pendingTransaction: false },
        });

        return transaction;
      } catch (error) {
        // Remover flag de transação pendente em caso de erro
        await prisma.account.update({
          where: { id: investmentAccount.id },
          data: { pendingTransaction: false },
        });
        throw error;
      }
    });
  }

  async sellStock(
    userId: number,
    sellAssetDto: SellAssetDto,
  ): Promise<Transaction> {
    const { assetSymbol, quantity } = sellAssetDto;

    // Verificar se o stock existe
    const stock = await this.getStock(assetSymbol);
    if (!stock) {
      throw new NotFoundException(`Stock ${assetSymbol} not found`);
    }

    // Buscar conta de investimento do usuário
    const investmentAccount = await this.prismaService.account.findFirst({
      where: {
        userId,
        type: AccountType.investment_account,
        active: true,
      },
    });

    if (!investmentAccount) {
      throw new NotFoundException('Investment account not found or inactive');
    }

    // Verificar se há transação pendente
    if (investmentAccount.pendingTransaction) {
      throw new BadRequestException(
        'There is a pending transaction on this account',
      );
    }

    // Para simplificar, vamos assumir que o usuário tem as ações
    // Em um sistema real, teríamos uma tabela de posições/portfólio

    // Calcular valores
    const grossAmount = stock.currentPrice * quantity;

    // Simular cálculo de rendimento (assumindo preço de compra anterior)
    // Em um sistema real, buscaríamos o preço médio de compra das ações
    const assumedBuyPrice = stock.currentPrice * 0.9; // Assumindo 10% de ganho
    const profit = (stock.currentPrice - assumedBuyPrice) * quantity;
    const taxAmount = profit > 0 ? profit * this.TAX_RATE : 0;
    const netAmount = grossAmount - taxAmount;

    // Executar transação
    return this.prismaService.$transaction(async (prisma) => {
      // Marcar conta como tendo transação pendente
      await prisma.account.update({
        where: { id: investmentAccount.id },
        data: { pendingTransaction: true },
      });

      try {
        // Creditar valor na conta
        await prisma.account.update({
          where: { id: investmentAccount.id },
          data: {
            balance: investmentAccount.balance + netAmount,
          },
        });

        // Criar transação
        const transaction = await prisma.transaction.create({
          data: {
            toAccountId: investmentAccount.id,
            amount: netAmount,
            type: TransactionType.asset_sale,
            description: `Sale of ${quantity} ${assetSymbol} shares at $${stock.currentPrice} each (Gross: $${grossAmount.toFixed(2)}, Tax: $${taxAmount.toFixed(2)}, Net: $${netAmount.toFixed(2)})`,
          },
        });

        // Remover flag de transação pendente
        await prisma.account.update({
          where: { id: investmentAccount.id },
          data: { pendingTransaction: false },
        });

        return transaction;
      } catch (error) {
        // Remover flag de transação pendente em caso de erro
        await prisma.account.update({
          where: { id: investmentAccount.id },
          data: { pendingTransaction: false },
        });
        throw error;
      }
    });
  }
}
