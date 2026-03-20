import { NextRequest, NextResponse } from 'next/server'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

// Webhook обработчик сообщений от Telegram
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📩 Получено сообщение от Telegram:', body)

    // Обрабатываем сообщение
    if (body.message) {
      const chatId = body.message.chat.id
      const text = body.message.text

      // Команда /start
      if (text === '/start') {
        await sendMessage(chatId, getWelcomeMessage())
      }

      // Команда /help
      else if (text === '/help') {
        await sendMessage(chatId, getHelpMessage())
      }

      // Команда /balance
      else if (text === '/balance') {
        await sendMessage(chatId, '💰 Ваш баланс: загрузка...\n\nОткройте личный кабинет для подробностей.')
      }
    }

    // Обрабатываем нажатия кнопок
    if (body.callback_query) {
      const callbackQuery = body.callback_query
      const chatId = callbackQuery.message.chat.id
      const data = callbackQuery.data

      if (data === 'open_dashboard') {
        await sendMessage(chatId, '🔐 Откройте личный кабинет:\nhttps://arcanumnox.net/login')
      }

      // Подтверждаем callback
      await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackQuery.id }),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('❌ Ошибка обработки Telegram webhook:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// Отправка сообщения
async function sendMessage(chatId: number, text: string, keyboard?: any) {
  const payload: any = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  }

  if (keyboard) {
    payload.reply_markup = keyboard
  }

  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return response.json()
}

// Приветственное сообщение
function getWelcomeMessage() {
  return `
👋 <b>Добро пожаловать в Arcanum VPN!</b>

🔐 Надёжный VPN-сервис для свободного интернета.

<b>Что умеет бот:</b>
├ 🏠 Личный кабинет — управление подпиской
├ 💰 Баланс — проверка и пополнение
├ 📱 Устройства — добавление и управление
├ 👥 Реферальная программа — 100₽ за друга
└ ❓ Помощь — инструкции и поддержка

<b>🎁 15 дней бесплатно для новых пользователей!</b>

Используйте кнопки ниже или команды:
/help — помощь
/balance — баланс
  `
}

// Сообщение помощи
function getHelpMessage() {
  return `
❓ <b>Помощь по Arcanum VPN</b>

<b>Команды бота:</b>
/start — главное меню
/balance — проверить баланс
/help — эта справка

<b>Как начать:</b>
1. Откройте личный кабинет
2. Пополните баланс от 50₽
3. Добавьте устройство
4. Скачайте VPN-клиент
5. Вставьте ключ подписки

<b>Тарифы:</b>
├ 📱 Базовый — 100₽/мес (1 устройство)
├ 💻 Стандарт — 250₽/мес (все устройства)
├ 🚀 Про — 390₽/мес (стриминг + приоритет)
├ 👑 Элит — 590₽/мес (выделенный IP)
└ 👨‍👩‍👧‍👦 Семья — от 390₽/мес (до 15 человек)

📞 <b>Поддержка:</b> @arcanum_support
  `
}

// GET endpoint для проверки
export async function GET() {
  return NextResponse.json({ 
    status: 'OK',
    bot: 'Arcanum VPN Bot',
    timestamp: new Date().toISOString()
  })
}