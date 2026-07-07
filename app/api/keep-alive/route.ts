import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { getAppwrite, DATABASE_ID, TABLE_STATS } from '@/lib/appwrite'

// Pinged daily by a Vercel Cron (see vercel.json) to keep the Appwrite
// project from hibernating due to inactivity on the Free plan.
export async function GET(req: NextRequest) {
  // If a CRON_SECRET is configured, require Vercel's cron Authorization header.
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { tablesDB } = getAppwrite()
    await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: TABLE_STATS,
      queries: [Query.limit(1)],
    })
    return NextResponse.json({ ok: true, ts: new Date().toISOString() })
  } catch (err) {
    console.error('keep-alive error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
