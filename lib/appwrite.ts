import { Client, TablesDB, Storage } from 'node-appwrite'

// ── Resource identifiers ─────────────────────────────────────────────────────
export const DATABASE_ID = 'main'
export const TABLE_PROFILES = 'athlete_profiles'
export const TABLE_STATS = 'coach_stats'
export const TABLE_BOT_PENDING = 'bot_pending'
export const BUCKET_PHOTOS = 'athlete-photos'

// ── Admin client (server-side only, API key) ─────────────────────────────────
export function getAppwrite() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!)

  return {
    client,
    tablesDB: new TablesDB(client),
    storage: new Storage(client),
  }
}

// Public "view" URL for a file in the (public-read) photos bucket.
export function filePublicUrl(fileId: string): string {
  const endpoint = (process.env.APPWRITE_ENDPOINT ?? '').replace(/\/$/, '')
  const project = process.env.APPWRITE_PROJECT_ID ?? ''
  return `${endpoint}/storage/buckets/${BUCKET_PHOTOS}/files/${fileId}/view?project=${project}`
}

// ── Types (shape preserved from the Supabase version) ────────────────────────
export type CoachStat = {
  key: string
  label: string
  value: string
  sort_order: number
}

export type AthleteProfile = {
  id: string
  created_at: string
  name: string
  photo_url: string | null
  testimonial: string
  months: number
  instagram_url: string | null
  strava_url: string | null
  facebook_url: string | null
  twitter_url: string | null
  status: string
  member_id: string
}

// ── Row → app-type mappers ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToProfile(row: any): AthleteProfile {
  return {
    id: row.$id,
    created_at: row.created_at ?? row.$createdAt,
    name: row.name,
    photo_url: row.photo_url ?? null,
    testimonial: row.testimonial,
    months: row.months,
    instagram_url: row.instagram_url ?? null,
    strava_url: row.strava_url ?? null,
    facebook_url: row.facebook_url ?? null,
    twitter_url: row.twitter_url ?? null,
    status: row.status,
    member_id: row.member_id,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToStat(row: any): CoachStat {
  return {
    key: row.key ?? row.$id,
    label: row.label,
    value: row.value,
    sort_order: row.sort_order,
  }
}
