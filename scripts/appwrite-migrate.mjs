// Copy live data from Supabase into Appwrite: coach_stats, athlete_profiles
// (re-uploading each photo into the Appwrite bucket), and bot_pending.
//
//   node scripts/appwrite-migrate.mjs   — loads .env.local automatically
//
// Idempotent: rows that already exist (HTTP 409) are skipped. Run after
// scripts/appwrite-setup.mjs.

import { Client, TablesDB, Storage, ID, Permission, Role } from 'node-appwrite'
import { InputFile } from 'node-appwrite/file'
import { createClient } from '@supabase/supabase-js'
import { loadEnv, requireEnv } from './_env.mjs'

loadEnv()
requireEnv('APPWRITE_ENDPOINT', 'APPWRITE_PROJECT_ID', 'APPWRITE_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY')

const DATABASE_ID = 'main'
const TABLE_PROFILES = 'athlete_profiles'
const TABLE_STATS = 'coach_stats'
const TABLE_BOT_PENDING = 'bot_pending'
const BUCKET_PHOTOS = 'athlete-photos'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)
const db = new TablesDB(client)
const storage = new Storage(client)

const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '')
const project = process.env.APPWRITE_PROJECT_ID
const filePublicUrl = (fileId) =>
  `${endpoint}/storage/buckets/${BUCKET_PHOTOS}/files/${fileId}/view?project=${project}`

async function createRow(tableId, rowId, data) {
  try {
    await db.createRow({ databaseId: DATABASE_ID, tableId, rowId, data })
    console.log(`  ✓ ${tableId}/${rowId}`)
  } catch (err) {
    if (err?.code === 409) { console.log(`  • ${tableId}/${rowId} (exists, skipped)`); return }
    throw err
  }
}

// Download a photo from its Supabase public URL and re-upload to Appwrite.
async function migratePhoto(url) {
  if (!url) return null
  try {
    const res = await fetch(url)
    if (!res.ok) { console.warn(`  ! photo fetch ${res.status} for ${url}`); return url }
    const buf = Buffer.from(await res.arrayBuffer())
    const name = url.split('/').pop()?.split('?')[0] || 'photo.jpg'
    const file = await storage.createFile({
      bucketId: BUCKET_PHOTOS,
      fileId: ID.unique(),
      file: InputFile.fromBuffer(buf, name),
      permissions: [Permission.read(Role.any())],
    })
    return filePublicUrl(file.$id)
  } catch (err) {
    console.warn(`  ! photo migrate failed (${err?.message ?? err}) — keeping original URL`)
    return url
  }
}

async function main() {
  // ── coach_stats ───────────────────────────────────────────────────────────
  console.log('coach_stats')
  const { data: stats = [] } = await supabase.from('coach_stats').select('*').order('sort_order', { ascending: true })
  for (const s of stats ?? []) {
    await createRow(TABLE_STATS, s.key, {
      key: s.key, label: s.label, value: s.value, sort_order: s.sort_order, year: s.year ?? null,
    })
  }

  // ── athlete_profiles ──────────────────────────────────────────────────────
  console.log('athlete_profiles')
  const { data: profiles = [] } = await supabase.from('athlete_profiles').select('*')
  for (const p of profiles ?? []) {
    const photo_url = await migratePhoto(p.photo_url)
    await createRow(TABLE_PROFILES, p.id, {
      name: p.name,
      photo_url,
      testimonial: p.testimonial,
      months: p.months,
      instagram_url: p.instagram_url ?? null,
      strava_url: p.strava_url ?? null,
      facebook_url: p.facebook_url ?? null,
      twitter_url: p.twitter_url ?? null,
      status: p.status,
      member_id: p.member_id,
      created_at: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
    })
  }

  // ── bot_pending (transient; usually empty) ────────────────────────────────
  console.log('bot_pending')
  const { data: pending = [] } = await supabase.from('bot_pending').select('*')
  for (const b of pending ?? []) {
    await createRow(TABLE_BOT_PENDING, String(b.chat_id), {
      chat_id: String(b.chat_id),
      pr_key: b.pr_key,
      step: b.step ?? 'awaiting_value',
      pending_value: b.pending_value ?? null,
      created_at: b.created_at ? new Date(b.created_at).toISOString() : new Date().toISOString(),
    })
  }

  console.log('\nMigration complete.')
}

main().catch((err) => { console.error(err); process.exit(1) })
