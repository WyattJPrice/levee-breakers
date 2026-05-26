import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isRateLimited } from '@/lib/rateLimit'

const SUBMITTED_COOKIE = 'lb_submitted'
const SUBMISSION_ID_COOKIE = 'lb_submission_id'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function cookieOpts(maxAge: number) {
  return { httpOnly: true, maxAge, path: '/', sameSite: 'lax' as const }
}

async function notifyTelegram(lines: string[]) {
  const chatIds = (process.env.TELEGRAM_CHAT_ID ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token || chatIds.length === 0) return
  await Promise.all(
    chatIds.map((chat_id) =>
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, text: lines.join('\n'), parse_mode: 'Markdown' }),
      }).catch(() => {})
    )
  )
}

export async function POST(req: NextRequest) {
  if (req.cookies.get(SUBMITTED_COOKIE)?.value === '1') {
    return NextResponse.json({ error: 'Already submitted' }, { status: 429 })
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many submissions from this device' }, { status: 429 })
  }

  const formData = await req.formData()
  const name = (formData.get('name') as string)?.trim()
  const testimonial = (formData.get('testimonial') as string)?.trim()
  const months = parseInt(formData.get('months') as string, 10)
  const instagram = (formData.get('instagram') as string)?.trim() || null
  const strava = (formData.get('strava') as string)?.trim() || null
  const photo = formData.get('photo') as File | null

  if (!name || !testimonial || isNaN(months) || months < 1) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  let photoUrl: string | null = null
  if (photo && photo.size > 0) {
    const ext = photo.name.split('.').pop() ?? 'jpg'
    const path = `direct-${Date.now()}.${ext}`
    const arrayBuffer = await photo.arrayBuffer()
    const { data, error } = await supabase.storage
      .from('athlete-photos')
      .upload(path, Buffer.from(arrayBuffer), { contentType: photo.type, upsert: true })
    if (error) return NextResponse.json({ error: 'Photo upload failed' }, { status: 500 })
    photoUrl = supabase.storage.from('athlete-photos').getPublicUrl(data.path).data.publicUrl
  }

  const { data: inserted, error: dbError } = await supabase
    .from('athlete_profiles')
    .insert({ name, photo_url: photoUrl, testimonial, months, instagram_url: instagram, strava_url: strava, status: 'pending', member_id: 'direct' })
    .select('id')
    .single()

  if (dbError || !inserted) {
    console.error('Supabase insert error:', dbError)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set(SUBMITTED_COOKIE, '1', cookieOpts(COOKIE_MAX_AGE))
  res.cookies.set(SUBMISSION_ID_COOKIE, inserted.id, cookieOpts(COOKIE_MAX_AGE))
  return res
}

export async function PUT(req: NextRequest) {
  const submissionId = req.cookies.get(SUBMISSION_ID_COOKIE)?.value
  if (!submissionId) return NextResponse.json({ error: 'No submission found' }, { status: 404 })

  const formData = await req.formData()
  const name = (formData.get('name') as string)?.trim()
  const testimonial = (formData.get('testimonial') as string)?.trim()
  const months = parseInt(formData.get('months') as string, 10)
  const instagram = (formData.get('instagram') as string)?.trim() || null
  const strava = (formData.get('strava') as string)?.trim() || null
  const photo = formData.get('photo') as File | null

  if (!name || !testimonial || isNaN(months) || months < 1) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data: existing } = await supabase
    .from('athlete_profiles')
    .select('photo_url')
    .eq('id', submissionId)
    .single()

  let photoUrl: string | null = existing?.photo_url ?? null
  if (photo && photo.size > 0) {
    const ext = photo.name.split('.').pop() ?? 'jpg'
    const path = `direct-${submissionId}-${Date.now()}.${ext}`
    const arrayBuffer = await photo.arrayBuffer()
    const { data, error } = await supabase.storage
      .from('athlete-photos')
      .upload(path, Buffer.from(arrayBuffer), { contentType: photo.type, upsert: true })
    if (error) return NextResponse.json({ error: 'Photo upload failed' }, { status: 500 })
    photoUrl = supabase.storage.from('athlete-photos').getPublicUrl(data.path).data.publicUrl
  }

  const { data: updated, error: dbError } = await supabase
    .from('athlete_profiles')
    .update({ name, photo_url: photoUrl, testimonial, months, instagram_url: instagram, strava_url: strava, status: 'approved' })
    .eq('id', submissionId)
    .select('*')
    .single()

  if (dbError || !updated) {
    console.error('Supabase update error:', dbError)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  await notifyTelegram([
    `✏️ *Profile Updated — Now Live*`,
    `*Name:* ${name}`,
    `*Months with coach:* ${months}`,
    `*Testimonial:* ${testimonial}`,
    ...(photoUrl ? [`[View Photo](${photoUrl})`] : []),
  ])

  return NextResponse.json({ success: true, profile: updated })
}

export async function DELETE(req: NextRequest) {
  const submissionId = req.cookies.get(SUBMISSION_ID_COOKIE)?.value
  if (!submissionId) return NextResponse.json({ error: 'No submission found' }, { status: 404 })

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('athlete_profiles').delete().eq('id', submissionId)

  if (error) {
    console.error('Supabase delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.delete(SUBMITTED_COOKIE)
  res.cookies.delete(SUBMISSION_ID_COOKIE)
  return res
}
