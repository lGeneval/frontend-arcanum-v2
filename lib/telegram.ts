const apiUrl = (method: string) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  return `https://api.telegram.org/bot${token}/${method}`;
};

export async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: object) {
  const response = await fetch(apiUrl("sendMessage"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true, reply_markup: replyMarkup }),
  });
  if (!response.ok) throw new Error(`Telegram API returned ${response.status}`);
}
