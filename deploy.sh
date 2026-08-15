#!/bin/bash
set -e

echo "🚀 Iniciando deploy da VIBE_APP..."

# 1. Puxar as últimas alterações do GitHub
echo "📥 Puxar código da branch develop..."
git pull origin develop

# 2. Atualizar o Backend (Laravel)
echo "⚙️  Atualizando dependências do Backend..."
cd backend
composer install --no-interaction --prefer-dist --optimize-autoloader

echo "🗄️  Correndo migrações da base de dados..."
php artisan migrate --force

echo "🧹 Limpando cache do Laravel..."
php artisan optimize:clear
php artisan optimize

echo "🔄 Reiniciando workers do Supervisor..."
sudo supervisorctl restart vibeapp-worker:*
cd ..

# 3. Atualizar o Frontend (React/Vite)
echo "🎨 Atualizando Frontend..."
cd frontend
npm install
npm run build
cd ..

echo "✅ Deploy concluído com sucesso!"
