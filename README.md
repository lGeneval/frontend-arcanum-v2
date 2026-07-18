# Arcanum

Новая безопасная основа сайта и Telegram-бота.

## Локальный запуск

1. Скопировать `.env.example` в `.env.local` и заполнить значения.
2. Выполнить SQL-миграцию из `supabase/migrations` в новом Supabase.
3. `npm install`
4. `npm run dev`

Telegram webhook должен указывать на `/api/telegram` и использовать заголовок `X-Telegram-Bot-Api-Secret-Token`.
