import { NextRequest, NextResponse } from 'next/server'
import { ID, Permission, Role } from 'node-appwrite'
import { InputFile } from 'node-appwrite/file'
import { getAppwrite, filePublicUrl, rowToProfile, DATABASE_ID, TABLE_PROFILES, BUCKET_PHOTOS } from '@/lib/appwrite'
import { notifyLines, notifyNewSubmission } from '@/lib/telegram'
import { isRateLimited } from '@/lib/rateLimit'

const SUBMITTED_COOKIE = 'lb_submitted'
const SUBMISSION_ID_COOKIE = 'lb_submission_id'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function cookieOpts(maxAge: number) {
  return { httpOnly: true, maxAge, path: '/', sameSite: 'lax' as const }
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
        member_id: 'direct',
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

  const res = NextResponse.json({ success: true })
  res.cookies.set(SUBMITTED_COOKIE, '1', cookieOpts(COOKIE_MAX_AGE))
  res.cookies.set(SUBMISSION_ID_COOKIE, insertedId, cookieOpts(COOKIE_MAX_AGE))
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

  const { tablesDB, storage } = getAppwrite()

  let photoUrl: string | null = null
  try {
    const existing = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_PROFILES,
      rowId: submissionId,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    photoUrl = (existing as any).photo_url ?? null
  } catch {
    // row may not exist; treated as no prior photo
  }

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

  let updated
  try {
    updated = await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_PROFILES,
      rowId: submissionId,
      data: {
        name,
        photo_url: photoUrl,
        testimonial,
        months,
        instagram_url: instagram,
        strava_url: strava,
        status: 'approved',
      },
    })
  } catch (err) {
    console.error('Appwrite update error:', err)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  await notifyLines([
    `✏️ *Profile Updated — Now Live*`,
    `*Name:* ${name}`,
    `*Months with coach:* ${months}`,
    `*Testimonial:* ${testimonial}`,
    ...(photoUrl ? [`[View Photo](${photoUrl})`] : []),
  ])

  return NextResponse.json({ success: true, profile: rowToProfile(updated) })
}

export async function DELETE(req: NextRequest) {
  const submissionId = req.cookies.get(SUBMISSION_ID_COOKIE)?.value
  if (!submissionId) return NextResponse.json({ error: 'No submission found' }, { status: 404 })

  const { tablesDB } = getAppwrite()
  try {
    await tablesDB.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_PROFILES,
      rowId: submissionId,
    })
  } catch (err) {
    console.error('Appwrite delete error:', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.delete(SUBMITTED_COOKIE)
  res.cookies.delete(SUBMISSION_ID_COOKIE)
  return res
}
