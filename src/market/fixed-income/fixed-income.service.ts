import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountType,
  FixedIncome,
  Transaction,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '@src/database/prisma/prisma.service';
import { BuyAssetDto } from '../dto/buy-asset.dto';
import { SellAssetDto } from '../dto/sell-asset.dto';

@Injectable()
export class FixedIncomeService {
  private readonly logger = new Logger(FixedIncomeService.name);
  private readonly TAX_RATE = 0.22; // 22% for fixed income

  constructor(private readonly prismaService: PrismaService) {}

  async getAllFixedIncomes(): Promise<FixedIncome[]> {
    return this.prismaService.fixedIncome.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getFixedIncome(id: string): Promise<FixedIncome | null> {
    return this.prismaService.fixedIncome.findUnique({
      where: { id },
    });
  }

  async buyFixedIncome(
    userId: number,
    buyAssetDto: BuyAssetDto,
  ): Promise<Transaction> {
    const { assetSymbol, quantity } = buyAssetDto;

    // Verificar se o ativo de renda fixa existe
    const fixedIncome = await this.getFixedIncome(assetSymbol);
    if (!fixedIncome) {
      throw new NotFoundException(
        `Fixed income asset ${assetSymbol} not found`,
      );
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

    // Calcular valor total (quantidade para renda fixa representa o valor investido)
    const totalCost = quantity;

    // Verificar investimento mínimo
    if (totalCost < fixedIncome.minimumInvestment) {
      throw new BadRequestException(
        `Minimum investment for ${assetSymbol} is $${fixedIncome.minimumInvestment}`,
      );
    }

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
            description: `Investment in ${fixedIncome.name} - $${totalCost} (Rate: ${fixedIncome.rate}% ${fixedIncome.rateType})`,
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

  async sellFixedIncome(
    userId: number,
    sellAssetDto: SellAssetDto,
  ): Promise<Transaction> {
    const { assetSymbol, quantity } = sellAssetDto;

    // Verificar se o ativo de renda fixa existe
    const fixedIncome = await this.getFixedIncome(assetSymbol);
    if (!fixedIncome) {
      throw new NotFoundException(
        `Fixed income asset ${assetSymbol} not found`,
      );
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

    // Para simplificar, vamos calcular o rendimento baseado na taxa
    // Em um sistema real, calcularíamos com base no tempo decorrido
    const principalAmount = quantity;
    const timeFactorMonths = 6; // Assumindo 6 meses de investimento
    const yearlyRate = fixedIncome.rate / 100;
    const monthlyRate = yearlyRate / 12;
    const grossAmount = principalAmount * (1 + monthlyRate * timeFactorMonths);

    // Calcular rendimento e imposto
    const profit = grossAmount - principalAmount;
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
            description: `Redemption of ${fixedIncome.name} - Principal: $${principalAmount}, Gross: $${grossAmount.toFixed(2)}, Tax: $${taxAmount.toFixed(2)}, Net: $${netAmount.toFixed(2)}`,
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
