<h1 align="center">OrangeBank API</h1>

<p align="center">
  Backend para o hackathon da Orange Juice, com o desafio de criar um mini banco de investimentos.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D22.0.0-blue.svg" alt="Node Version" />
  <img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" />
  <img src="https://img.shields.io/badge/license-UNLICENSED-red.svg" alt="Package License" />
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>

## 🍊 Sobre o Projeto

O OrangeBank API é o backend de um banco digital de investimentos, desenvolvido com **NestJS**, **Prisma** e **PostgreSQL**. A aplicação oferece funcionalidades essenciais para gerenciamento de contas, transações financeiras e autenticação de usuários.

## ✨ Principais Funcionalidades

-   🔐 **Autenticação:** Registro e login de usuários com JWT.
-   🏦 **Gerenciamento de Contas:** Criação, listagem, ativação e desativação de contas.
-   💰 **Transações Financeiras:** Depósitos, saques e transferências entre contas.
-   📈 **Investimentos:** Gestão de ações e títulos de renda fixa.
-   📄 **Histórico:** Consulta de extrato de transações.

## 🛠️ Tecnologias Utilizadas

-   [NestJS](https://nestjs.com/)
-   [Prisma](https://www.prisma.io/)
-   [PostgreSQL](https://www.postgresql.org/)
-   [TypeScript](https://www.typescriptlang.org/)
-   [JWT (JSON Web Token)](https://jwt.io/)
-   [Swagger](https://swagger.io/) para documentação

## 🚀 Como Executar

A maneira mais simples de configurar e rodar o projeto é utilizando o nosso script de utilidades.

### Pré-requisitos

-   [Node.js](https://nodejs.org/en/) (versão >= 22.0.0)
-   [Docker](https://www.docker.com/) e Docker Compose
-   Permissão de execução para o script: `chmod +x ./scripts/dev-utils.sh`

### 📦 Configuração Rápida com Utilitário

1.  **Clone o repositório**
    ```bash
    git clone https://github.com/luskas8/orangebank-api.git
    cd orangebank-api
    ```

2.  **Instale as dependências**
    ```bash
    npm install
    ```

3.  **Configure e inicie o ambiente**
    O script `dev-utils.sh` irá criar o arquivo `.env` e iniciar os containers Docker.
    ```bash
    ./scripts/dev-utils.sh setup
    ./scripts/dev-utils.sh run
    ```

4.  **Execute as migrações e popule o banco**
    ```bash
    npx prisma migrate dev
    npm run prisma:seed # Opcional
    ```

A API estará disponível em `http://localhost:3000`. Para parar os serviços, utilize `./scripts/dev-utils.sh down`.

### 📜 Configuração Manual

Caso prefira, siga os passos manuais:

1.  **Clone e instale:** Siga os passos 1 e 2 da configuração rápida.
2.  **Variáveis de Ambiente:** Crie um arquivo `.env` na raiz do projeto e adicione as variáveis de ambiente necessárias. Você pode usar o comando `./scripts/dev-utils.sh setup`.
3.  **Banco de Dados:** Inicie o container do PostgreSQL.
    ```bash
    docker-compose up -d
    ```
4.  **Migrações e Seed:** Execute os passos 4 e 5 da configuração rápida.
5.  **Iniciar a Aplicação:** Execute o passo 5 da configuração rápida.

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Cobertura de testes
npm run test:cov
```

## 📚 Documentação da API

A documentação completa dos endpoints, com exemplos de requisições e respostas, está disponível via Swagger UI.

**Acesse em:** [http://localhost:3000/docs](http://localhost:3000/docs)

### Resumo dos Endpoints

#### 🔐 Autenticação
- `POST /auth/login`: Login de usuário.
- `POST /auth/register`: Registro de novo usuário.

#### 🏦 Contas
- `POST /account/create`: Criar nova conta.
- `GET /account/get`: Listar contas do usuário.
- `GET /account/get/:id`: Buscar conta específica.

#### 💰 Transações
- `POST /account/deposit`: Depósito em conta.
- `POST /account/withdraw`: Saque da conta.
- `POST /account/transfer`: Transferência entre contas.
- `GET /account/transactions/:id`: Histórico de transações.
