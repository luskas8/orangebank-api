#!/bin/bash

# Script para executar o seed do banco de dados
# Este script verifica se os arquivos necessários existem antes de executar o seed

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 Iniciando processo de seed do OrangeBank API..."

# Verificar se os arquivos de mock existem
USERS_MOCK="$PROJECT_ROOT/prisma/seeds/users-mock.json"
ASSETS_MOCK="$PROJECT_ROOT/prisma/seeds/assets-mock.json"

if [ ! -f "$USERS_MOCK" ]; then
    echo "❌ Arquivo users-mock.json não encontrado em: $USERS_MOCK"
    echo "ℹ️  Crie o arquivo com a estrutura:"
    echo '{"users": [{"id": "1", "name": "João Silva", "email": "joao.silva@email.com", "cpf": "123.456.789-00", "birthDate": "1990-01-15"}]}'
    exit 1
fi

if [ ! -f "$ASSETS_MOCK" ]; then
    echo "❌ Arquivo assets-mock.json não encontrado em: $ASSETS_MOCK"
    echo "ℹ️  Crie o arquivo com a estrutura:"
    echo '{"stocks": [{"symbol": "BOIB3", "name": "Boi Bom", "sector": "Agro", "currentPrice": 25.50, "dailyVariation": 1.2}]}'
    exit 1
fi

echo "✅ Arquivos de mock encontrados!"

# Navegar para o diretório do projeto
cd "$PROJECT_ROOT" || exit 1

echo "📦 Instalando dependências se necessário..."
npm ci --silent

echo "🗄️  Gerando cliente Prisma..."
npx prisma generate

echo "📊 Executando migrações..."
npx prisma migrate deploy

echo "🌱 Executando seed..."
npm run prisma:seed

echo "🎉 Processo concluído!"
echo ""
echo "👤 Usuários criados com senha padrão: orangebank123@"
echo "💰 Cada usuário recebe:"
echo "   - Conta corrente com R$ 10.000,00"
echo "   - Conta de investimento com R$ 0,00"
echo "📈 Ativos carregados no sistema"
