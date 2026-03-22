import { NextRequest, NextResponse } from 'next/server'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`
const WEBSITE_URL = 'https://arcanumnox.net'

// Webhook обработчик сообщений от Telegram
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Обрабатываем сообщение
    if (body.message) {
      const chatId = body.message.chat.id
      const text = body.message.text

      // Команда /start
      if (text === '/start') {
        await sendWelcomeMessage(chatId)
      }

      // Команда /help
      else if (text === '/help') {
        await sendHelpMessage(chatId)
      }
    }

    // Обрабатываем нажатия кнопок
    if (body.callback_query) {
      const callbackQuery = body.callback_query
      const chatId = callbackQuery.message.chat.id
      const data = callbackQuery.data

      if (data === 'invite') {
        // TODO: Получить реферальный код пользователя из БД
        const refCode = 'DEMO123' // Заглушка
        await sendMessage(
          chatId,
          `🎁 <b>Приглашайте друзей!</b>\n\nПолучайте <b>100₽</b> за каждого приглашённого.\n\n` +
          `Ваша ссылка:\n<code>${WEBSITE_URL}/ref/${refCode}</code>\n\n` +
          `Подробности в личном кабинете.`,
          { parse_mode: 'HTML' }
        )
      }

      if (data === 'help') {
        await sendHelpMessage(chatId)
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

// Отправка приветственного сообщения
async function sendWelcomeMessage(chatId: number) {
  const text = `👋 <b>Добро пожаловать в Arcanum VPN!</b>

🔐 Надёжная защита вашего интернета

Управляйте подпиской через личный кабинет 👇`

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '🏠 Личный кабинет',
          url: `${WEBSITE_URL}/login?source=telegram`,
        },
      ],
      [
        {
          text: '👥 Пригласить',
          callback_data: 'invite',
        },
        {
          text: '❓ Помощь',
          callback_data: 'help',
        },
      ],
    ],
  }

  await sendMessage(chatId, text, { parse_mode: 'HTML', reply_markup: keyboard })
}

// Отправка сообщения помощи
async function sendHelpMessage(chatId: number) {
  const text = `❓ <b>Помощь</b>

📱 <b>Как начать:</b>
1. Откройте личный кабинет
2. Пополните баланс
3. Выберите тариф
4. Добавьте устройство

📧 <b>Поддержка:</b> support@arcanumnox.net
💬 <b>Telegram:</b> @arcanum_support

/start — главное меню`

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '🏠 Личный кабинет',
          url: `${WEBSITE_URL}/login?source=telegram`,
        },
      ],
    ],
  }

  await sendMessage(chatId, text, { parse_mode: 'HTML', reply_markup: keyboard })
}

// Отправка сообщения
async function sendMessage(chatId: number, text: string, options?: any) {
  const payload: any = {
    chat_id: chatId,
    text,
    ...options,
  }

  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return response.json()
}

// GET endpoint для проверки
export async function GET() {
  return NextResponse.json({
    status: 'OK',
    bot: 'Arcanum VPN Bot',
    timestamp: new Date().toISOString(),
  })
}