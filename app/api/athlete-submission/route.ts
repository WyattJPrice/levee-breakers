import { NextRequest, NextResponse } from 'next/server'
import { ID, Permission, Role } from 'node-appwrite'
import { InputFile } from 'node-appwrite/file'
import { getWixClient } from '@/lib/wix'
import { getAppwrite, filePublicUrl, DATABASE_ID, TABLE_PROFILES, BUCKET_PHOTOS } from '@/lib/appwrite'
import { notifyNewSubmission } from '@/lib/telegram'

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

  const { tablesDB, storage } = getAppwrite()

  let photoUrl: string | null = null
  if (photo && photo.size > 0) {
    try {
      const arrayBuffer = await photo.arrayBuffer()
      const file = await storage.createFile({
        bucketId: BUCKET_PHOTOS,
        fileId: ID.unique(),
        file: InputFile.fromBuffer(Buffer.from(arrayBuffer), photo.name || 'photo.jpg'),
        permissions: [Permission.read(Role.any())],
      })
      photoUrl = filePublicUrl(file.$id)
    } catch (err) {
      console.error('Appwrite photo upload error:', err)
      return NextResponse.json({ error: 'Photo upload failed' }, { status: 500 })
    }
  }

  let insertedId: string
  try {
    const row = await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_PROFILES,
      rowId: ID.unique(),
      data: {
        name,
        photo_url: photoUrl,
        testimonial,
        months,
        instagram_url: instagram,
        strava_url: strava,
        status: 'pending',
        member_id: memberId,
        created_at: new Date().toISOString(),
      },
    })
    insertedId = row.$id
  } catch (err) {
    console.error('Appwrite insert error:', err)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }

  await notifyNewSubmission({
    id: insertedId,
    name,
    months,
    testimonial,
    instagram_url: instagram,
    strava_url: strava,
    photo_url: photoUrl,
  })

  return NextResponse.json({ success: true })
}
