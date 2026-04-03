import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
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
    if (error) {
      return NextResponse.json({ error: 'Photo upload failed' }, { status: 500 })
    }
    photoUrl = supabase.storage.from('athlete-photos').getPublicUrl(data.path).data.publicUrl
  }

  const { error: dbError } = await supabase.from('athlete_profiles').insert({
    name,
    photo_url: photoUrl,
    testimonial,
    months,
    instagram_url: instagram,
    strava_url: strava,
    status: 'pending',
    member_id: 'direct',
  })

  if (dbError) {
    console.error('Supabase insert error:', dbError)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
