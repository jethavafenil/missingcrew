'use client'

import { useState } from 'react'
import { ExternalLink, Play } from 'lucide-react'
import { vimeoId, youtubeId } from '@/lib/crew/profileFields'

// Showreel on top of a profile. YouTube shows its thumbnail first and only loads the
// player when clicked (keeps the page fast on mobile); Vimeo and other links open the player/link.
export function ShowreelPlayer({ url, name }: { url: string | null | undefined; name: string }) {
  const [playing, setPlaying] = useState(false)
  const [thumbFailed, setThumbFailed] = useState(false)
  if (!url) return null

  const yt = youtubeId(url)
  const vm = vimeoId(url)

  if (yt || vm) {
    const src = yt
      ? `https://www.youtube.com/embed/${yt}?autoplay=1&rel=0`
      : `https://player.vimeo.com/video/${vm}?autoplay=1&title=0&byline=0&portrait=0`
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg">
        {playing ? (
          <iframe
            src={src}
            title={`${name} showreel`}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 h-full w-full" aria-label={`Play ${name} showreel`}>
            {yt && !thumbFailed && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://img.youtube.com/vi/${yt}/hqdefault.jpg`} alt="" onError={() => setThumbFailed(true)} className="h-full w-full object-cover opacity-90" />
            )}
            {(!yt || thumbFailed) && <span className="absolute inset-0 bg-gradient-to-br from-gray-800 via-indigo-900 to-purple-900" />}
            <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-xl transition group-hover:scale-110">
              <Play className="ml-1 h-7 w-7 text-gray-900" />
            </span>
            <span className="absolute bottom-3 left-4 text-sm font-semibold text-white">Showreel</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex aspect-video w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 text-white shadow-lg hover:bg-gray-800"
    >
      <ExternalLink className="h-5 w-5" /> Watch showreel
    </a>
  )
}
