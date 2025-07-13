# Market API - Guia de Uso

## 📈 API de Mercado - OrangeBank

Esta API permite operações de compra e venda de ações e investimentos em renda fixa.

### 🔐 Autenticação

Todas as rotas requerem autenticação JWT. Inclua o token no header:
```
Authorization: Bearer <seu-jwt-token>
```

## 📊 Endpoints Disponíveis

### 1. Listar Ações
```http
GET /market/stocks
```

**Resposta:**
```json
[
  {
    "id": "AAPL",
    "name": "Apple Inc.",
    "sector": "Technology",
    "currentPrice": 150.25,
    "dailyVariation": 2.5,
    "createdAt": "2025-07-13T00:00:00.000Z",
    "updatedAt": "2025-07-13T00:00:00.000Z"
  }
]
```

### 2. Listar Renda Fixa
```http
GET /market/fixed-incomes
```

**Resposta:**
```json
[
  {
    "id": "CDB001",
    "name": "CDB Banco ABC",
    "type": "CDB",
    "rate": 12.5,
    "rateType": "annual",
    "maturity": "2026-07-13T00:00:00.000Z",
    "minimumInvestment": 1000,
    "createdAt": "2025-07-13T00:00:00.000Z",
    "updatedAt": "2025-07-13T00:00:00.000Z"
  }
]
```

### 3. Comprar Ações
```http
POST /market/buy/stock
```

**Body:**
```json
{
  "assetSymbol": "AAPL",
  "quantity": 10
}
```

**Resposta:**
```json
{
  "id": "transaction-id",
  "fromAccountId": "account-id",
  "amount": 1517.525,
  "type": "asset_purchase",
  "description": "Purchase of 10 AAPL shares at $150.25 each (Brokerage fee: $15.03)",
  "createdAt": "2025-07-13T00:00:00.000Z"
}
```

### 4. Vender Ações
```http
POST /market/sell/stock
```

**Body:**
```json
{
  "assetSymbol": "AAPL",
  "quantity": 5
}
```

**Resposta:**
```json
{
  "id": "transaction-id",
  "toAccountId": "account-id",
  "amount": 739.98,
  "type": "asset_sale",
  "description": "Sale of 5 AAPL shares at $150.25 each - Gross: $751.25, Tax: $11.27, Net: $739.98",
  "createdAt": "2025-07-13T00:00:00.000Z"
}
```

### 5. Investir em Renda Fixa
```http
POST /market/buy/fixed-income
```

**Body:**
```json
{
  "assetSymbol": "CDB001",
  "quantity": 5000
}
```

**Resposta:**
```json
{
  "id": "transaction-id",
  "fromAccountId": "account-id",
  "amount": 5000,
  "type": "asset_purchase",
  "description": "Investment in CDB Banco ABC - $5000 (Rate: 12.5% annual)",
  "createdAt": "2025-07-13T00:00:00.000Z"
}
```

### 6. Resgatar Renda Fixa
```http
POST /market/sell/fixed-income
```

**Body:**
```json
{
  "assetSymbol": "CDB001",
  "quantity": 3000
}
```

**Resposta:**
```json
{
  "id": "transaction-id",
  "toAccountId": "account-id",
  "amount": 3234.50,
  "type": "asset_sale",
  "description": "Redemption of CDB Banco ABC - Principal: $3000, Gross: $3187.50, Tax: $41.25, Net: $3146.25",
  "createdAt": "2025-07-13T00:00:00.000Z"
}
```

## 💰 Regras de Negócio

### Ações (Stocks)
- **Taxa de Corretagem**: 1% sobre o valor total da compra
- **Imposto sobre Lucro**: 15% sobre o ganho na venda
- **Cálculo do Lucro**: Baseado em preço de compra simulado (90% do preço atual)

### Renda Fixa (Fixed Income)
- **Investimento Mínimo**: Definido por produto (ex: R$ 1.000)
- **Rendimento**: Calculado com base na taxa anual do produto
- **Tempo de Investimento**: Simulado em 6 meses para cálculos
- **Imposto**: 22% sobre o rendimento obtido

### Validações Gerais
- ✅ Conta de investimento deve estar ativa
- ✅ Saldo suficiente na conta
- ✅ Não pode haver transação pendente
- ✅ Asset deve existir no sistema

## 🚨 Códigos de Erro

### 400 - Bad Request
- Saldo insuficiente
- Conta inativa
- Transação pendente
- Valor abaixo do mínimo (renda fixa)

### 404 - Not Found
- Asset não encontrado
- Conta de investimento não encontrada

### 401 - Unauthorized
- Token JWT inválido ou ausente

## 🧪 Executar Testes

Para executar os testes do módulo market:

```bash
# Todos os testes do market
npm test -- --testPathPattern=market

# Apenas testes de ações
npm test -- --testPathPattern=stock.service.spec.ts

# Apenas testes de renda fixa
npm test -- --testPathPattern=fixed-income.service.spec.ts

# Apenas testes do controller
npm test -- --testPathPattern=market.controller.spec.ts
```

## 📚 Swagger Documentation

A documentação completa da API está disponível no Swagger:
```
GET /api-docs
```

Todos os endpoints estão devidamente documentados com exemplos de request/response e códigos de erro.
