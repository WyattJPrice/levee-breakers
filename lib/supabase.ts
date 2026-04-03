import { createClient } from '@supabase/supabase-js'

export function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
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
