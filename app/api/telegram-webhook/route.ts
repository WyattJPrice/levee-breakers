import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { getAppwrite, DATABASE_ID, TABLE_PROFILES, TABLE_STATS, TABLE_BOT_PENDING } from '@/lib/appwrite'
import { tg } from '@/lib/telegram'

function isAuthorized(chatId: number | string): boolean {
  const allowed = (process.env.TELEGRAM_CHAT_ID ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  return allowed.includes(String(chatId))
}

// getRow that resolves to null instead of throwing on 404.
async function getRowOrNull(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tablesDB: any,
  tableId: string,
  rowId: string
) {
  try {
    return await tablesDB.getRow({ databaseId: DATABASE_ID, tableId, rowId })
  } catch {
    return null
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCallbackQuery(query: any) {
  const [action, id] = (query.data as string).split(':')
  const { tablesDB } = getAppwrite()

  // ── Athlete approve / reject ──────────────────────────────────────────────
  if (action === 'approve' || action === 'reject') {
    const existing = await getRowOrNull(tablesDB, TABLE_PROFILES, id)

    if (existing && existing.status !== 'pending') {
      const already = existing.status === 'approved' ? '✅ Already approved' : '❌ Already rejected'
      await tg('answerCallbackQuery', { callback_query_id: query.id, text: already, show_alert: true })
      return NextResponse.json({ ok: true })
    }

    const status = action === 'approve' ? 'approved' : 'rejected'
    try {
      await tablesDB.updateRow({ databaseId: DATABASE_ID, tableId: TABLE_PROFILES, rowId: id, data: { status } })
    } catch (err) {
      console.error('Appwrite update error:', err)
    }

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

    // Upsert bot_pending keyed by chat id.
    await tablesDB.upsertRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_BOT_PENDING,
      rowId: String(chatId),
      data: { chat_id: String(chatId), pr_key: id, step: 'awaiting_value', created_at: new Date().toISOString() },
    })

    const stat = await getRowOrNull(tablesDB, TABLE_STATS, id)

    await Promise.all([
      tg('answerCallbackQuery', { callback_query_id: query.id }),
      tg('sendMessage', {
        chat_id: chatId,
        text: `Enter new value for *${stat?.label ?? id}* (current: \`${stat?.value ?? '?'}\`):`,
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
    const { tablesDB } = getAppwrite()
    const { rows: stats } = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: TABLE_STATS,
      queries: [Query.orderAsc('sort_order'), Query.limit(100)],
    })

    if (!stats || stats.length === 0) {
      await tg('sendMessage', { chat_id: chatId, text: 'No stats found in database.' })
      return NextResponse.json({ ok: true })
    }

    const rows: { text: string; callback_data: string }[][] = []
    for (let i = 0; i < stats.length; i += 2) {
      const row = [{ text: `${stats[i].label}: ${stats[i].value}`, callback_data: `update_pr:${stats[i].$id}` }]
      if (stats[i + 1]) {
        row.push({ text: `${stats[i + 1].label}: ${stats[i + 1].value}`, callback_data: `update_pr:${stats[i + 1].$id}` })
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

  // ── Pending PR value input ────────────────────────────────────────────────
  if (!text.startsWith('/')) {
    const { tablesDB } = getAppwrite()
    const pending = await getRowOrNull(tablesDB, TABLE_BOT_PENDING, String(chatId))

    if (pending) {
      const stat = await getRowOrNull(tablesDB, TABLE_STATS, pending.pr_key)

      let updateError = false
      try {
        await tablesDB.updateRow({
          databaseId: DATABASE_ID,
          tableId: TABLE_STATS,
          rowId: pending.pr_key,
          data: { value: text },
        })
      } catch (err) {
        console.error('Appwrite stat update error:', err)
        updateError = true
      }

      try {
        await tablesDB.deleteRow({ databaseId: DATABASE_ID, tableId: TABLE_BOT_PENDING, rowId: String(chatId) })
      } catch {
        // ignore
      }

      if (updateError) {
        await tg('sendMessage', { chat_id: chatId, text: '❌ Failed to update stat.' })
      } else {
        await tg('sendMessage', {
          chat_id: chatId,
          text: `✅ Updated *${stat?.label ?? pending.pr_key}* to \`${text}\` — live on site.`,
          parse_mode: 'Markdown',
        })
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
