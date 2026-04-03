'use client'

import { useState, useRef } from 'react'
import styles from './AthleteSubmissionForm.module.css'

export default function DirectAthleteSubmissionForm() {
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (success) {
    return (
      <p className={styles.success}>
        Thanks! Your profile is under review. Jarrett will approve it shortly.
      </p>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      const res = await fetch('/api/athlete-submission-direct', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Something went wrong. Please try again.')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

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
        />
      </div>

      <div className={styles.field}>
        <span className={`${styles.label} ${styles.labelOptional}`}>Profile photo</span>
        <label className={styles.fileLabel} htmlFor="dsf-photo">
          {fileName ? 'Change photo' : 'Choose photo'}
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
          />
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.submit} disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Profile'}
      </button>
    </form>
  )
}
