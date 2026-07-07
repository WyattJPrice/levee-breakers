'use client'

import { useState, useRef } from 'react'
import styles from './AthleteSubmissionForm.module.css'
import type { AthleteProfile } from '@/lib/appwrite'

type Mode = 'create' | 'view' | 'editing' | 'done' | 'deleted'

export default function DirectAthleteSubmissionForm({
  existingProfile = null,
}: {
  existingProfile?: AthleteProfile | null
}) {
  const [mode, setMode] = useState<Mode>(existingProfile ? 'view' : 'create')
  const [profile, setProfile] = useState<AthleteProfile | null>(existingProfile)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (mode === 'done') {
    return (
      <p className={styles.success}>
        Thanks! Your profile is under review. Jarrett will approve it shortly.
      </p>
    )
  }

  if (mode === 'deleted') {
    return (
      <div className={styles.form}>
        <p className={styles.success}>Your submission has been removed.</p>
        <button type="button" className={styles.submit} onClick={() => setMode('create')}>
          Submit a new story
        </button>
      </div>
    )
  }

  if (mode === 'view' && profile) {
    return (
      <div className={styles.card}>
        {profile.photo_url && (
          <div className={styles.cardPhotoWrap}>
            <img src={profile.photo_url} alt={profile.name} className={styles.cardPhotoImg} />
          </div>
        )}
        <div className={styles.cardBody}>
          <div className={styles.cardName}>{profile.name}</div>
          <div className={styles.cardMeta}>
            Levee Breaker · {profile.months} month{profile.months === 1 ? '' : 's'}
          </div>
          <p className={styles.cardQuote}>&ldquo;{profile.testimonial}&rdquo;</p>
          <span className={`${styles.statusPill} ${profile.status === 'approved' ? styles.statusApproved : styles.statusPending}`}>
            {profile.status === 'approved' ? 'Live on site' : 'Pending review'}
          </span>
          <div className={styles.cardActions}>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() => { setError(null); setFileName(null); setMode('editing') }}
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    const isEdit = mode === 'editing'

    try {
      const res = await fetch('/api/athlete-submission-direct', {
        method: isEdit ? 'PUT' : 'POST',
        body: formData,
      })
      const json = await res.json()

      if (res.status === 429) {
        setError('You have already submitted a story from this device.')
      } else if (!res.ok) {
        setError(json.error ?? 'Something went wrong. Please try again.')
      } else if (isEdit) {
        setProfile(json.profile)
        setMode('view')
      } else {
        setMode('done')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Remove your submission from the site?')) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/athlete-submission-direct', { method: 'DELETE' })
      if (res.ok) {
        setProfile(null)
        setMode('deleted')
      } else {
        setError('Failed to remove. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const isEdit = mode === 'editing'

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="dsf-name">Name</label>
          <input
            id="dsf-name"
            name="name"
            className={styles.input}
            placeholder="Your full name"
            required
            maxLength={80}
            defaultValue={isEdit ? (profile?.name ?? '') : undefined}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="dsf-months">Months with coach</label>
          <input
            id="dsf-months"
            name="months"
            type="number"
            min={1}
            max={240}
            className={styles.input}
            placeholder="e.g. 6"
            required
            defaultValue={isEdit ? (profile?.months ?? '') : undefined}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="dsf-testimonial">Testimonial</label>
        <textarea
          id="dsf-testimonial"
          name="testimonial"
          className={styles.textarea}
          placeholder="What has being a Levee Breaker meant to you?"
          required
          maxLength={300}
          defaultValue={isEdit ? (profile?.testimonial ?? '') : undefined}
        />
      </div>

      <div className={styles.field}>
        <span className={`${styles.label} ${styles.labelOptional}`}>Profile photo</span>
        {isEdit && profile?.photo_url && !fileName && (
          <span className={styles.fileName}>Current photo saved</span>
        )}
        <label className={styles.fileLabel} htmlFor="dsf-photo">
          {fileName ? 'Change photo' : isEdit ? 'Replace photo' : 'Choose photo'}
        </label>
        <input
          id="dsf-photo"
          name="photo"
          type="file"
          accept="image/*"
          className={styles.fileInput}
          ref={fileInputRef}
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
        {fileName && <span className={styles.fileName}>{fileName}</span>}
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={`${styles.label} ${styles.labelOptional}`} htmlFor="dsf-instagram">Instagram URL</label>
          <input
            id="dsf-instagram"
            name="instagram"
            type="url"
            className={styles.input}
            placeholder="https://instagram.com/..."
            defaultValue={isEdit ? (profile?.instagram_url ?? '') : undefined}
          />
        </div>
        <div className={styles.field}>
          <label className={`${styles.label} ${styles.labelOptional}`} htmlFor="dsf-strava">Strava URL</label>
          <input
            id="dsf-strava"
            name="strava"
            type="url"
            className={styles.input}
            placeholder="https://strava.com/..."
            defaultValue={isEdit ? (profile?.strava_url ?? '') : undefined}
          />
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.formActions}>
        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting
            ? (isEdit ? 'Saving…' : 'Submitting…')
            : (isEdit ? 'Save Changes' : 'Submit Profile')}
        </button>
        {isEdit && (
          <>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() => setMode('view')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.btnDanger}
              onClick={handleDelete}
              disabled={submitting}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </form>
  )
}
