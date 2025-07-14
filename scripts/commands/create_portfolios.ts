import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Account {
  id: string;
  type: 'current_account' | 'investment_account';
}

async function main() {
  console.log('🌱 Iniciando seed de portfolios...');
  const accounts: Account[] = await prisma.account.findMany({
    where: {
      type: 'investment_account',
      portfolioId: null,
    },
    select: {
      id: true,
      type: true,
    },
  });
  console.log(`🔍 Encontradas ${accounts.length} contas de investimento.`);
  if (accounts.length === 0) {
    console.log(
      'ℹ️ Nenhuma conta de investimento encontrada, pulando seed de portfolios...',
    );
    return;
  }

  const portfolios = accounts.map(async (account) => {
    try {
      const portfolio = await prisma.portfolio.create({
        data: {
          accountId: account.id,
        },
      });
      console.log(`✅ Portfolio criado para a conta ${account.id}`);
      await prisma.account.update({
        where: { id: account.id },
        data: { portfolioId: portfolio.id },
      });
      console.log(
        `🔗 Conta ${account.id} atualizada com portfolio ${portfolio.id}`,
      );
      return portfolio.id;
    } catch (error) {
      console.error(
        `❌ Erro ao criar portfolio para a conta ${account.id}:`,
        error,
      );
      return null;
    }
  });
  await Promise.any(portfolios);
  console.log(`✅ ${portfolios.length} portfolios criados com sucesso!`);
}

void main();
