import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface StockData {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  dailyVariation: number;
}

enum FixedIncomeType {
  CDB = 'cdb',
  'Tesouro Direto' = 'tesouro_direto',
}

interface FixedIncomeData {
  id: string;
  name: string;
  type: FixedIncomeType;
  rate: number;
  rateType: string;
  maturity: string;
  minimumInvestment: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: string;
}

interface AssetsMock {
  stocks: StockData[];
  fixedIncome: FixedIncomeData[];
}

interface UsersMock {
  users: UserData[];
}

const DEFAULT_PASSWORD = 'orangebank123@';

function loadMockData<T>(filename: string): T {
  try {
    const filePath = path.join(__dirname, 'seeds', filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent) as T;
  } catch (error) {
    console.error(`Erro ao carregar arquivo ${filename}:`, error);
    throw error;
  }
}

async function seedUsers() {
  console.log('🌱 Iniciando seed de usuários...');

  try {
    const usersMock = loadMockData<UsersMock>('users-mock.json');
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    for (const userData of usersMock.users) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`ℹ️  Usuário ${userData.email} já existe, pulando...`);
        continue;
      }

      const cleanedCpf = userData.cpf.replace(/[.\-\s]/g, '');

      await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          cpf: cleanedCpf,
          birthDate: new Date(userData.birthDate),
          password: hashedPassword,
        },
      });

      console.log(`✅ Usuário ${userData.name} criado com sucesso!`);
    }

    console.log('🎉 Seed de usuários concluído!');
  } catch (error) {
    console.error('❌ Erro no seed de usuários:', error);
    throw error;
  }
}

async function seedAssets() {
  console.log('🌱 Iniciando seed de ativos...');

  try {
    const assetsMock = loadMockData<AssetsMock>('assets-mock.json');

    // Seed de Stocks
    console.log('📈 Criando stocks...');
    for (const stockData of assetsMock.stocks) {
      const existingStock = await prisma.stock.findUnique({
        where: { id: stockData.symbol },
      });

      if (existingStock) {
        console.log(
          `ℹ️  Stock ${stockData.symbol} já existe, atualizando preço...`,
        );

        await prisma.stock.update({
          where: { id: stockData.symbol },
          data: {
            currentPrice: stockData.currentPrice,
            dailyVariation: stockData.dailyVariation,
          },
        });

        // Adicionar histórico de preço
        await prisma.stockHistory.create({
          data: {
            stockId: stockData.symbol,
            price: stockData.currentPrice,
          },
        });

        console.log(`🔄 Stock ${stockData.symbol} atualizado!`);
        continue;
      }

      await prisma.stock.create({
        data: {
          id: stockData.symbol,
          name: stockData.name,
          sector: stockData.sector,
          currentPrice: stockData.currentPrice,
          dailyVariation: stockData.dailyVariation,
        },
      });

      // Criar histórico inicial do preço
      await prisma.stockHistory.create({
        data: {
          stockId: stockData.symbol,
          price: stockData.currentPrice,
        },
      });

      console.log(`✅ Stock ${stockData.symbol} criado com sucesso!`);
    }

    // Seed de Fixed Income
    console.log('💰 Criando renda fixa...');
    for (const fixedIncomeData of assetsMock.fixedIncome) {
      const existingFixedIncome = await prisma.fixedIncome.findUnique({
        where: { id: fixedIncomeData.id },
      });

      if (existingFixedIncome) {
        console.log(
          `ℹ️  Renda fixa ${fixedIncomeData.id} já existe, atualizando...`,
        );

        await prisma.fixedIncome.update({
          where: { id: fixedIncomeData.id },
          data: {
            rate: fixedIncomeData.rate,
            maturity: new Date(fixedIncomeData.maturity),
            minimumInvestment: fixedIncomeData.minimumInvestment,
          },
        });

        console.log(`🔄 Renda fixa ${fixedIncomeData.id} atualizada!`);
        continue;
      }

      await prisma.fixedIncome.create({
        data: {
          id: fixedIncomeData.id,
          name: fixedIncomeData.name,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          type: FixedIncomeType[fixedIncomeData.type],
          rate: fixedIncomeData.rate,
          rateType: fixedIncomeData.rateType,
          maturity: new Date(fixedIncomeData.maturity),
          minimumInvestment: fixedIncomeData.minimumInvestment,
        },
      });

      console.log(`✅ Renda fixa ${fixedIncomeData.id} criada com sucesso!`);
    }

    console.log('🎉 Seed de ativos concluído!');
  } catch (error) {
    console.error('❌ Erro no seed de ativos:', error);
    throw error;
  }
}

async function createDefaultAccounts() {
  console.log('🌱 Criando contas padrão para usuários...');

  try {
    const users = await prisma.user.findMany();

    for (const user of users) {
      // Verificar se o usuário já tem contas
      const existingAccounts = await prisma.account.findMany({
        where: { userId: user.id },
      });

      if (existingAccounts.length > 0) {
        console.log(`ℹ️  Usuário ${user.name} já possui contas, pulando...`);
        continue;
      }

      // Criar conta corrente
      const currentAccount = await prisma.account.create({
        data: {
          type: 'current_account',
          balance: 10000.0, // Saldo inicial de R$ 10.000
          userId: user.id,
        },
      });

      // Criar conta de investimento
      const investmentAccount = await prisma.account.create({
        data: {
          type: 'investment_account',
          balance: 0.0,
          userId: user.id,
        },
      });

      console.log(
        `✅ Contas criadas para ${user.name}: Corrente (${currentAccount.id}) e Investimento (${investmentAccount.id})`,
      );
    }

    console.log('🎉 Criação de contas padrão concluída!');
  } catch (error) {
    console.error('❌ Erro na criação de contas padrão:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Iniciando processo de seed...');

  try {
    await seedUsers();
    await seedAssets();
    await createDefaultAccounts();

    console.log('🎊 Processo de seed concluído com sucesso!');
  } catch (error) {
    console.error('💥 Erro durante o processo de seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
