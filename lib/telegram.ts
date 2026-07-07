const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? ''

function chatIds(): string[] {
  return (process.env.TELEGRAM_CHAT_ID ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export async function tg(method: string, body: object) {
  return fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// Simple broadcast of a Markdown message to every configured chat.
export async function notifyLines(lines: string[]) {
  const ids = chatIds()
  if (!TOKEN || ids.length === 0) return
  await Promise.all(
    ids.map((chat_id) =>
      tg('sendMessage', { chat_id, text: lines.join('\n'), parse_mode: 'Markdown' }).catch(() => {})
    )
  )
}

// New pending athlete submission → send the approve/reject message.
// Replaces the former Supabase Database Webhook → /api/supabase-webhook.
export async function notifyNewSubmission(record: {
  id: string
  name: string
  months: number
  testimonial: string
  instagram_url?: string | null
  strava_url?: string | null
  photo_url?: string | null
}) {
  const ids = chatIds()
  if (!TOKEN || ids.length === 0) return

  const lines = [
    `🏃 *New Athlete Submission*`,
    `*Name:* ${record.name}`,
    `*Months with coach:* ${record.months}`,
    `*Testimonial:* ${record.testimonial}`,
  ]
  if (record.instagram_url) lines.push(`*Instagram:* ${record.instagram_url}`)
  if (record.strava_url) lines.push(`*Strava:* ${record.strava_url}`)
  if (record.photo_url) lines.push(`[View Photo](${record.photo_url})`)

  const reply_markup = {
    inline_keyboard: [[
      { text: '✅ Approve', callback_data: `approve:${record.id}` },
      { text: '❌ Reject', callback_data: `reject:${record.id}` },
    ]],
  }

  await Promise.all(
    ids.map((chat_id) =>
      tg('sendMessage', { chat_id, text: lines.join('\n'), parse_mode: 'Markdown', reply_markup })
        .then((r) => { if (!r.ok) console.error(`Telegram sendMessage failed for ${chat_id}:`, r.statusText) })
        .catch(() => {})
    )
  )
}
