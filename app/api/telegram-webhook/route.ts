import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? ''

function isAuthorized(chatId: number | string): boolean {
  const allowed = (process.env.TELEGRAM_CHAT_ID ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  return allowed.includes(String(chatId))
}

async function tg(method: string, body: object) {
  return fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCallbackQuery(query: any) {
  const [action, id] = (query.data as string).split(':')
  const supabase = getSupabaseAdmin()

  // ── Athlete approve / reject ──────────────────────────────────────────────
  if (action === 'approve' || action === 'reject') {
    const { data: existing } = await supabase
      .from('athlete_profiles')
      .select('status')
      .eq('id', id)
      .single()

    if (existing && existing.status !== 'pending') {
      const already = existing.status === 'approved' ? '✅ Already approved' : '❌ Already rejected'
      await tg('answerCallbackQuery', { callback_query_id: query.id, text: already, show_alert: true })
      return NextResponse.json({ ok: true })
    }

    const status = action === 'approve' ? 'approved' : 'rejected'
    const { error } = await supabase.from('athlete_profiles').update({ status }).eq('id', id)
    if (error) console.error('Supabase update error:', error)

    const chatId = query.message.chat.id
    const messageId = query.message.message_id
    const emoji = status === 'approved' ? '✅' : '❌'
    const label = status === 'approved' ? 'Approved' : 'Rejected'

    await Promise.all([
      tg('answerCallbackQuery', { callback_query_id: query.id }),
      tg('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: `${emoji} *${label}*\n\n${query.message.text}`,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [] },
      }),
    ])
    return NextResponse.json({ ok: true })
  }

  // ── PR selection ──────────────────────────────────────────────────────────
  if (action === 'update_pr') {
    const chatId = query.message.chat.id

    await supabase.from('bot_pending').upsert({
      chat_id: chatId,
      pr_key: id,
      step: 'awaiting_value',
      pending_value: null,
      created_at: new Date().toISOString(),
    })

    const { data: stat } = await supabase.from('coach_stats').select('label, value, year').eq('key', id).single()
    const currentDisplay = stat?.year ? `${stat.value} (${stat.year})` : (stat?.value ?? '?')

    await Promise.all([
      tg('answerCallbackQuery', { callback_query_id: query.id }),
      tg('sendMessage', {
        chat_id: chatId,
        text: `Enter new value for *${stat?.label ?? id}* (current: \`${currentDisplay}\`):`,
        parse_mode: 'Markdown',
        reply_markup: { force_reply: true, selective: true },
      }),
    ])
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleMessage(message: any) {
  const chatId: number = message.chat.id
  const text: string = (message.text ?? '').trim()

  if (!isAuthorized(chatId)) return NextResponse.json({ ok: true })

  // ── /PRupdate command ─────────────────────────────────────────────────────
  if (text.toLowerCase().startsWith('/prupdate')) {
    const supabase = getSupabaseAdmin()
    const { data: stats } = await supabase
      .from('coach_stats')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!stats || stats.length === 0) {
      await tg('sendMessage', { chat_id: chatId, text: 'No stats found in database.' })
      return NextResponse.json({ ok: true })
    }

    const statLabel = (s: { label: string; value: string; year: string | null }) =>
      s.year ? `${s.label}: ${s.value} (${s.year})` : `${s.label}: ${s.value}`

    const rows: { text: string; callback_data: string }[][] = []
    for (let i = 0; i < stats.length; i += 2) {
      const row = [{ text: statLabel(stats[i]), callback_data: `update_pr:${stats[i].key}` }]
      if (stats[i + 1]) {
        row.push({ text: statLabel(stats[i + 1]), callback_data: `update_pr:${stats[i + 1].key}` })
      }
      rows.push(row)
    }

    await tg('sendMessage', {
      chat_id: chatId,
      text: '*Update a PR — tap to select:*',
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: rows },
    })
    return NextResponse.json({ ok: true })
  }

  // ── Pending PR value / year input ────────────────────────────────────────
  if (!text.startsWith('/')) {
    const supabase = getSupabaseAdmin()
    const { data: pending } = await supabase
      .from('bot_pending')
      .select('pr_key, step, pending_value')
      .eq('chat_id', chatId)
      .single()

    if (pending) {
      const { data: stat } = await supabase
        .from('coach_stats')
        .select('label')
        .eq('key', pending.pr_key)
        .single()

      if (pending.step === 'awaiting_value') {
        // Store the value and ask for the year
        await supabase.from('bot_pending').update({ pending_value: text, step: 'awaiting_year' }).eq('chat_id', chatId)
        await tg('sendMessage', {
          chat_id: chatId,
          text: `Got it. Now enter the *year* this PR was set:`,
          parse_mode: 'Markdown',
          reply_markup: { force_reply: true, selective: true },
        })
      } else if (pending.step === 'awaiting_year') {
        // Commit both value and year
        const { error } = await supabase
          .from('coach_stats')
          .update({ value: pending.pending_value, year: text })
          .eq('key', pending.pr_key)

        await supabase.from('bot_pending').delete().eq('chat_id', chatId)

        if (error) {
          await tg('sendMessage', { chat_id: chatId, text: '❌ Failed to update stat.' })
        } else {
          await tg('sendMessage', {
            chat_id: chatId,
            text: `✅ Updated *${stat?.label ?? pending.pr_key}* to \`${pending.pending_value}\` (${text}) — live on site.`,
            parse_mode: 'Markdown',
          })
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (body.callback_query) return handleCallbackQuery(body.callback_query)
  if (body.message) return handleMessage(body.message)

  return NextResponse.json({ ok: true })
}
