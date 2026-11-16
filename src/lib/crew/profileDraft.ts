// The profile form saves itself while the member types. A half-typed value (a phone with 6 digits,
// a link that is still being pasted) must never block the rest of the profile from saving, so the
// draft sent to the server leaves out optional fields that are not valid yet and reports them
// back to the form to show next to the field.

import { isNationalMobile, sanitizeMobileInput } from '@/lib/phone'
import { cleanLink, sanitizeProfileLinks } from '@/lib/crew/profileLinks'
import { parseShowreel, vimeoId, youtubeId, withHttps } from '@/lib/crew/profileFields'

export type ShowreelState =
  | { state: 'empty' }
  | { state: 'invalid'; message: string }
  | { state: 'video'; url: string; provider: 'youtube' | 'vimeo'; thumbnail: string | null }
  | { state: 'link'; url: string }

// What the showreel box shows right after a paste: a preview for YouTube/Vimeo, a note for other links.
export function showreelStatus(raw: string | null | undefined): ShowreelState {
  const text = (raw || '').trim()
  if (!text) return { state: 'empty' }
  const parsed = parseShowreel(text)
  if (!parsed.ok) return { state: 'invalid', message: parsed.error }
  const url = parsed.value as string
  const yt = youtubeId(url)
  if (yt) return { state: 'video', url, provider: 'youtube', thumbnail: `https://img.youtube.com/vi/${yt}/hqdefault.jpg` }
  if (vimeoId(url)) return { state: 'video', url, provider: 'vimeo', thumbnail: null }
  return { state: 'link', url }
}

const IMDB = /^https:\/\/www\.imdb\.com\/name\/nm\d{7,8}$/

function imdbOk(raw: string): boolean {
  const normalized = raw
    .trim()
    .replace(/^http:\/\//i, 'https://')
    .replace(/\/+$/, '')
    .replace(/^https:\/\/(?:www\.|m\.)?imdb\.com\//i, 'https://www.imdb.com/')
  return IMDB.test(normalized)
}

export interface DraftProblems {
  phone?: string
  showreelUrl?: string
  imdbLink?: string
}

// Returns the form data safe to send, plus what was left out and why.
export function buildDraft<T extends Record<string, unknown>>(form: T): { data: Record<string, unknown>; problems: DraftProblems } {
  const data: Record<string, unknown> = { ...form }
  const problems: DraftProblems = {}

  if (typeof form.phone === 'string') {
    const phone = sanitizeMobileInput(form.phone)
    if (phone === '') data.phone = ''
    else if (isNationalMobile(phone)) data.phone = phone
    else {
      delete data.phone
      problems.phone = 'Enter all 10 digits'
    }
  }

  if (typeof form.showreelUrl === 'string' && form.showreelUrl.trim()) {
    const parsed = parseShowreel(form.showreelUrl)
    if (parsed.ok) data.showreelUrl = parsed.value
    else {
      delete data.showreelUrl
      problems.showreelUrl = parsed.error
    }
  }

  if (typeof form.imdbLink === 'string' && form.imdbLink.trim() && !imdbOk(form.imdbLink)) {
    delete data.imdbLink
    problems.imdbLink = 'Use the format https://www.imdb.com/name/nm0000129/'
  }

  if (Array.isArray(form.portfolioLinks)) data.portfolioLinks = sanitizeProfileLinks(form.portfolioLinks)

  return { data, problems }
}

export { cleanLink, withHttps }
