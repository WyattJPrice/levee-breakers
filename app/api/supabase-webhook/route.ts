import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await req.json()
  const record = payload.record

  if (!record || record.status !== 'pending') {
    return NextResponse.json({ ok: true })
  }

  const lines = [
    `🏃 *New Athlete Submission*`,
    `*Name:* ${record.name}`,
    `*Months with coach:* ${record.months}`,
    `*Testimonial:* ${record.testimonial}`,
  ]
  if (record.instagram_url) lines.push(`*Instagram:* ${record.instagram_url}`)
  if (record.strava_url) lines.push(`*Strava:* ${record.strava_url}`)
  if (record.photo_url) lines.push(`[View Photo](${record.photo_url})`)

  const chatIds = (process.env.TELEGRAM_CHAT_ID ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  const token = process.env.TELEGRAM_BOT_TOKEN
  const body = {
    text: lines.join('\n'),
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Approve', callback_data: `approve:${record.id}` },
        { text: '❌ Reject',  callback_data: `reject:${record.id}` },
      ]],
    },
  }

  await Promise.all(
    chatIds.map((chat_id) =>
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, ...body }),
      }).then((r) => { if (!r.ok) console.error(`Telegram sendMessage failed for ${chat_id}:`, r.statusText) })
    )
  )

  return NextResponse.json({ ok: true })
}
