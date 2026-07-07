// Provision the Appwrite database, tables, columns, indexes, and storage bucket
// to match the schema previously hosted on Supabase.
//
//   node --env-file=.env.local scripts/appwrite-setup.mjs
//   (or)  node scripts/appwrite-setup.mjs   — loads .env.local automatically
//
// Idempotent: existing resources (HTTP 409) are skipped.

import { Client, TablesDB, Storage, Permission, Role } from 'node-appwrite'
import { loadEnv, requireEnv } from './_env.mjs'

loadEnv()
requireEnv('APPWRITE_ENDPOINT', 'APPWRITE_PROJECT_ID', 'APPWRITE_API_KEY')

const DATABASE_ID = 'main'
const TABLE_PROFILES = 'athlete_profiles'
const TABLE_STATS = 'coach_stats'
const TABLE_BOT_PENDING = 'bot_pending'
const BUCKET_PHOTOS = 'athlete-photos'

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)

const db = new TablesDB(client)
const storage = new Storage(client)

const ok = (label) => (r) => { console.log(`  ✓ ${label}`); return r }
async function ignore409(label, fn) {
  try {
    const r = await fn()
    console.log(`  ✓ ${label}`)
    return r
  } catch (err) {
    if (err?.code === 409) { console.log(`  • ${label} (exists, skipped)`); return null }
    console.error(`  ✗ ${label}:`, err?.message ?? err)
    throw err
  }
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

// Wait until every column on a table reports status "available".
async function waitForColumns(tableId) {
  for (let i = 0; i < 30; i++) {
    const { columns } = await db.listColumns({ databaseId: DATABASE_ID, tableId })
    if (columns.length && columns.every((c) => c.status === 'available')) return
    await sleep(1000)
  }
  console.warn(`  ! columns on ${tableId} not all available after 30s — continuing`)
}

async function main() {
  console.log('Database')
  await ignore409('database "main"', () =>
    db.create({ databaseId: DATABASE_ID, name: 'Levee Breakers' })
  )

  // ── athlete_profiles ──────────────────────────────────────────────────────
  console.log('Table: athlete_profiles')
  await ignore409('table', () =>
    db.createTable({ databaseId: DATABASE_ID, tableId: TABLE_PROFILES, name: 'Athlete Profiles' })
  )
  const strCol = (tableId, key, size, required, def = undefined) =>
    ignore409(`column ${key}`, () =>
      db.createStringColumn({ databaseId: DATABASE_ID, tableId, key, size, required, default: def })
    )
  await strCol(TABLE_PROFILES, 'name', 200, true)
  await strCol(TABLE_PROFILES, 'photo_url', 2048, false)
  await strCol(TABLE_PROFILES, 'testimonial', 2000, true)
  await ignore409('column months', () =>
    db.createIntegerColumn({ databaseId: DATABASE_ID, tableId: TABLE_PROFILES, key: 'months', required: true })
  )
  await strCol(TABLE_PROFILES, 'instagram_url', 2048, false)
  await strCol(TABLE_PROFILES, 'strava_url', 2048, false)
  await strCol(TABLE_PROFILES, 'facebook_url', 2048, false)
  await strCol(TABLE_PROFILES, 'twitter_url', 2048, false)
  await strCol(TABLE_PROFILES, 'status', 32, false, 'pending')
  await strCol(TABLE_PROFILES, 'member_id', 128, true)
  await ignore409('column created_at', () =>
    db.createDatetimeColumn({ databaseId: DATABASE_ID, tableId: TABLE_PROFILES, key: 'created_at', required: true })
  )
  await waitForColumns(TABLE_PROFILES)
  await ignore409('index idx_status', () =>
    db.createIndex({ databaseId: DATABASE_ID, tableId: TABLE_PROFILES, key: 'idx_status', type: 'key', columns: ['status'] })
  )
  await ignore409('index idx_created', () =>
    db.createIndex({ databaseId: DATABASE_ID, tableId: TABLE_PROFILES, key: 'idx_created', type: 'key', columns: ['created_at'] })
  )

  // ── coach_stats (row id == key) ───────────────────────────────────────────
  console.log('Table: coach_stats')
  await ignore409('table', () =>
    db.createTable({ databaseId: DATABASE_ID, tableId: TABLE_STATS, name: 'Coach Stats' })
  )
  await strCol(TABLE_STATS, 'key', 64, true)
  await strCol(TABLE_STATS, 'label', 128, true)
  await strCol(TABLE_STATS, 'value', 64, true)
  await ignore409('column sort_order', () =>
    db.createIntegerColumn({ databaseId: DATABASE_ID, tableId: TABLE_STATS, key: 'sort_order', required: true })
  )
  await strCol(TABLE_STATS, 'year', 16, false)
  await waitForColumns(TABLE_STATS)
  await ignore409('index idx_sort', () =>
    db.createIndex({ databaseId: DATABASE_ID, tableId: TABLE_STATS, key: 'idx_sort', type: 'key', columns: ['sort_order'] })
  )

  // ── bot_pending (row id == chat_id) ───────────────────────────────────────
  console.log('Table: bot_pending')
  await ignore409('table', () =>
    db.createTable({ databaseId: DATABASE_ID, tableId: TABLE_BOT_PENDING, name: 'Bot Pending' })
  )
  await strCol(TABLE_BOT_PENDING, 'chat_id', 32, true)
  await strCol(TABLE_BOT_PENDING, 'pr_key', 64, true)
  await strCol(TABLE_BOT_PENDING, 'step', 32, false, 'awaiting_value')
  await strCol(TABLE_BOT_PENDING, 'pending_value', 256, false)
  await ignore409('column created_at', () =>
    db.createDatetimeColumn({ databaseId: DATABASE_ID, tableId: TABLE_BOT_PENDING, key: 'created_at', required: false })
  )
  await waitForColumns(TABLE_BOT_PENDING)

  // ── Storage bucket (public read) ──────────────────────────────────────────
  console.log('Storage')
  await ignore409('bucket athlete-photos', () =>
    storage.createBucket({
      bucketId: BUCKET_PHOTOS,
      name: 'Athlete Photos',
      permissions: [Permission.read(Role.any())],
      fileSecurity: false,
      enabled: true,
    })
  )

  console.log('\nDone. Now run: npm run appwrite:migrate')
}

main().catch((err) => { console.error(err); process.exit(1) })
