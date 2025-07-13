# Prisma Seed

Este diretório contém os scripts e arquivos de dados para popular o banco de dados com dados iniciais.

## Estrutura

- `seed.ts` - Script principal de seed
- `seeds/` - Diretório com arquivos JSON de dados mock
  - `users-mock.json` - Dados de usuários para seed
  - `assets-mock.json` - Dados de ativos para seed (stocks e renda fixa)

## Como usar

### 1. Executar o seed completo

```bash
npm run prisma:seed
```

ou

```bash
npx prisma db seed
```

### 2. Estrutura dos arquivos JSON

#### users-mock.json
```json
{
  "users": [
    {
      "id": "1",
      "name": "João Silva",
      "email": "joao.silva@email.com",
      "cpf": "123.456.789-00",
      "birthDate": "1990-01-15"
    }
  ]
}
```

**Nota:** Todos os usuários são criados com a senha padrão: `orangebank123@`

#### assets-mock.json
```json
{
  "stocks": [
    {
      "symbol": "BOIB3",
      "name": "Boi Bom",
      "sector": "Agro",
      "currentPrice": 25.50,
      "dailyVariation": 1.2
    }
  ],
  "fixedIncome": [
    {
      "id": "CDB001",
      "name": "CDB Banco A",
      "type": "CDB",
      "rate": 0.12,
      "rateType": "pre",
      "maturity": "2024-12-31",
      "minimumInvestment": 1000.00
    }
  ]
}
```

##### Campos da Renda Fixa:
- `id` - Identificador único do produto
- `name` - Nome do produto de renda fixa
- `type` - Tipo do produto (CDB, Tesouro Direto, etc.)
- `rate` - Taxa de juros (em decimal, ex: 0.12 = 12%)
- `rateType` - Tipo da taxa ("pre" para prefixado, "pos" para pós-fixado)
- `maturity` - Data de vencimento (formato ISO: YYYY-MM-DD)
- `minimumInvestment` - Investimento mínimo em reais

## O que o seed faz

1. **Cria usuários** com base no arquivo `users-mock.json`
   - Hash da senha padrão usando bcrypt
   - Verifica se o usuário já existe antes de criar

2. **Cria ativos** com base no arquivo `assets-mock.json`
   - **Stocks**: Se o ativo já existe, atualiza apenas o preço e variação diária
   - **Renda Fixa**: Se o produto já existe, atualiza taxa, vencimento e investimento mínimo
   - Cria histórico inicial de preços para stocks

3. **Cria contas padrão** para cada usuário
   - Conta corrente com saldo inicial de R$ 10.000,00
   - Conta de investimento com saldo inicial de R$ 0,00

## Modificando os dados

Para adicionar ou modificar dados:

1. Edite os arquivos JSON em `prisma/seeds/`
2. Execute o comando de seed novamente
3. O script detectará dados existentes e evitará duplicações

## Logs

O script fornece logs detalhados sobre:
- ✅ Itens criados com sucesso (usuários, stocks, renda fixa)
- ℹ️ Itens que já existem (serão pulados ou atualizados)
- 🔄 Itens atualizados (preços de stocks, dados de renda fixa)
- 📈 Histórico de preços criado para stocks
- 💰 Renda fixa processada
- ❌ Erros encontrados
