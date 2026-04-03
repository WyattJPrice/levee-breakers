import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const query = body.callback_query

  if (!query) return NextResponse.json({ ok: true })

  const [action, id] = (query.data as string).split(':')
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ ok: true })
  }

  const supabase = getSupabaseAdmin()

  // Check current status — another reviewer may have already acted
  const { data: existing } = await supabase
    .from('athlete_profiles')
    .select('status')
    .eq('id', id)
    .single()

  if (existing && existing.status !== 'pending') {
    const already = existing.status === 'approved' ? '✅ Already approved' : '❌ Already rejected'
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: query.id, text: already, show_alert: true }),
    })
    return NextResponse.json({ ok: true })
  }

  const status = action === 'approve' ? 'approved' : 'rejected'
  const { error } = await supabase
    .from('athlete_profiles')
    .update({ status })
    .eq('id', id)

  if (error) console.error('Supabase update error:', error)

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = query.message.chat.id
  const messageId = query.message.message_id
  const emoji = status === 'approved' ? '✅' : '❌'
  const label = status === 'approved' ? 'Approved' : 'Rejected'

  await Promise.all([
    // Clear the spinner on the button tap
    fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: query.id }),
    }),
    // Edit original message: prepend status, remove buttons
    fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: `${emoji} *${label}*\n\n${query.message.text}`,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [] },
      }),
    }),
  ])

  return NextResponse.json({ ok: true })
}
