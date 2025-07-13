# 📚 OrangeBank API - Swagger Documentation Guide

## 🎯 Overview

Todas as rotas possuem documentação detalhada, exemplos práticos e tratamento de erros padronizado.

## 📋 Formato Padrão de Erro

Todas as rotas seguem o formato de erro padronizado:

```json
{
  "statusCode": 400,
  "timestamp": "2025-07-13T18:15:45.123Z",
  "path": "/account/transactions/123",
  "method": "GET",
  "error": "ACCOUNT_NOT_FOUND",
  "message": "Account with ID 123 not found. Please verify the account ID.",
  "details": {
    "type": "ACCOUNT_NOT_FOUND",
    "cause": "Invalid account ID provided"
  }
}
```

## 🏗️ Estrutura da Documentação

### 🔐 Authentication

- `POST /auth/login` - Login de usuário
- `POST /auth/register` - Registro de novo usuário

### 🏦 Accounts

- `POST /account/create` - Criar nova conta
- `GET /account/get` - Listar contas do usuário
- `GET /account/get/:id` - Buscar conta específica
- `PATCH /account/activate/:id` - Ativar conta
- `DELETE /account/deativate/:id` - Desativar conta

### 💰 Transactions

- `POST /account/deposit` - Depósito em conta corrente
- `POST /account/withdraw` - Saque de conta corrente
- `POST /account/transfer` - Transferência entre contas
- `GET /account/transactions/:id` - Histórico de transações

### 🔍 Health & Info

- `GET /health` - Health check
- `GET /` - Redirecionamento para documentação

## 📱 Exemplos de Uso

### 1. Registro e Login

```bash
# Registrar usuário
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@email.com",
    "password": "senhaSegura123",
    "cpf": "123.456.789-00",
    "birthDate": "1990-01-01"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@email.com",
    "password": "senhaSegura123"
  }'
```

### 2. Operações com Contas

```bash
# Criar conta corrente (com token)
curl -X POST http://localhost:3000/account/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "type": "current_account",
    "initialBalance": 1000
  }'

# Listar contas
curl -X GET http://localhost:3000/account/get \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Transações

```bash
# Depósito
curl -X POST http://localhost:3000/account/deposit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500
  }'

# Transferência
curl -X POST http://localhost:3000/account/transfer \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccountType": "current_account",
    "toAccountId": "account-uuid",
    "amount": 200,
    "description": "Transferência teste"
  }'
```

**Acesse a documentação completa em:** `http://localhost:3000/docs`
