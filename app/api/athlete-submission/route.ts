import { NextRequest, NextResponse } from 'next/server'
import { getWixClient } from '@/lib/wix'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const wixClient = getWixClient({ get: (name) => req.cookies.get(name)?.value })

  if (!wixClient.auth.loggedIn()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let memberId: string
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { member } = await wixClient.members.getCurrentMember({ fieldsets: ['FULL'] as any })
    if (!member?._id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    memberId = member._id
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { orders: memberOrders } = await wixClient.orders.memberListOrders()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeOrders = (memberOrders ?? []) as any[]
    const monthlyId = process.env.NEXT_PUBLIC_WIX_PLAN_MONTHLY
    const hasMonthly = activeOrders.some(
      (o) => o.status === 'ACTIVE' && o.planId === monthlyId
    )
    if (!hasMonthly) {
      return NextResponse.json({ error: 'Monthly plan required' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: 'Could not verify plan' }, { status: 500 })
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
    const path = `${memberId}-${Date.now()}.${ext}`
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
    member_id: memberId,
  })

  if (dbError) {
    console.error('Supabase insert error:', dbError)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
