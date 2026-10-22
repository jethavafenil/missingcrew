// "Email" opens a compose window in the browser on desktop (instead of the Windows mail
// app) and the phone's own mail app on mobile.

export function isMobileDevice(userAgent: string): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)
}

export function emailComposeUrl(email: string, userAgent: string, subject = '', body = ''): string {
  const q = new URLSearchParams()
  if (subject) q.set('subject', subject)
  if (body) q.set('body', body)
  if (isMobileDevice(userAgent)) {
    const qs = q.toString().replace(/\+/g, '%20')
    return `mailto:${email}${qs ? `?${qs}` : ''}`
  }
  const g = new URLSearchParams({ view: 'cm', fs: '1', to: email })
  if (subject) g.set('su', subject)
  if (body) g.set('body', body)
  return `https://mail.google.com/mail/?${g.toString()}`
}

// wa.me needs digits only (with country code).
export function whatsappUrl(number: string, text = ''): string | null {
  const digits = number.replace(/\D/g, '')
  if (digits.length < 8) return null
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}
