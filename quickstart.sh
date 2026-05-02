#!/bin/bash
# Швидкий старт для локальної розробки

set -e

echo "🧵 Швейний цех — швидкий старт"
echo ""

if [ ! -f .env ]; then
  echo "📝 Створюю .env з прикладу..."
  cp .env.example .env
  SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/change-me-to-random-32-plus-character-string/$SECRET/" .env
  else
    sed -i "s/change-me-to-random-32-plus-character-string/$SECRET/" .env
  fi
  echo "✅ .env створено з випадковим AUTH_SECRET"
  echo "⚠️  Перевір DATABASE_URL і дані адміна в .env"
  echo ""
fi

echo "📦 Встановлюю залежності..."
npm install

echo ""
echo "🗄️  Застосовую міграції БД..."
npx prisma migrate dev --name init

echo ""
echo "👤 Створюю першого адміна..."
npm run db:seed

echo ""
echo "🚀 Запуск dev-сервера..."
echo "   Відкрий http://localhost:3000"
npm run dev
