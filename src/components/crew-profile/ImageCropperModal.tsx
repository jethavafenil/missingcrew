"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"

interface ImageCropperModalProps {
  src: string
  aspect?: number // width/height, default 1 (square)
  onCancel: () => void
  onCrop: (dataUrl: string) => void
}

// A lightweight, dependency-free image cropper that supports pan and zoom inside a square crop area.
// It renders the image absolutely positioned inside a fixed square container and exports the visible
// area to a canvas on confirm.
export function ImageCropperModal({ src, aspect = 1, onCancel, onCrop }: ImageCropperModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgNatural, setImgNatural] = useState<{ width: number; height: number } | null>(null)
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 300, height: 300 })

  // position offset in container space (pixels)
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  // user zoom factor relative to base (1 = cover fit)
  const [zoom, setZoom] = useState(1)

  // dragging
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const lastPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const cropAspect = aspect

  // Compute base scale that covers the crop container
  const baseScale = useMemo(() => {
    if (!imgNatural) return 1
    // container is square-ish based on aspect
    const cw = containerSize.width
    const ch = containerSize.height
    const sx = cw / imgNatural.width
    const sy = ch / imgNatural.height
    return Math.max(sx, sy)
  }, [imgNatural, containerSize])

  // Clamp the user zoom to [1, 3] (cover fit to 3x) — derived, no effect.
  const effectiveZoom = imgNatural ? Math.min(Math.max(zoom, 1), 3) : zoom
  const currentScale = baseScale * effectiveZoom

  const displayed = useMemo(() => {
    if (!imgNatural) return { width: 0, height: 0 }
    return {
      width: imgNatural.width * currentScale,
      height: imgNatural.height * currentScale,
    }
  }, [imgNatural, currentScale])

  // Keep container responsive up to a max size
  useEffect(() => {
    const updateSize = () => {
      const maxSize = 360
      const minSize = 240
      let size = 320
      if (typeof window !== "undefined") {
        const vw = Math.min(window.innerWidth - 48, maxSize)
        size = Math.max(minSize, vw)
      }
      // match aspect
      const width = size
      const height = Math.round(size / cropAspect)
      setContainerSize({ width, height })
    }
    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [cropAspect])

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setImgNatural({ width: img.naturalWidth, height: img.naturalHeight })
    setImgLoaded(true)
  }

  // Drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY }
    lastPos.current = { ...pos }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !dragStart.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setPos({ x: lastPos.current.x + dx, y: lastPos.current.y + dy })
  }
  const onMouseUp = () => {
    setDragging(false)
    dragStart.current = null
  }

  // Touch support
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0]
      setDragging(true)
      dragStart.current = { x: t.clientX, y: t.clientY }
      lastPos.current = { ...pos }
    }
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging || !dragStart.current || e.touches.length !== 1) return
    const t = e.touches[0]
    const dx = t.clientX - dragStart.current.x
    const dy = t.clientY - dragStart.current.y
    setPos({ x: lastPos.current.x + dx, y: lastPos.current.y + dy })
  }
  const onTouchEnd = () => {
    setDragging(false)
    dragStart.current = null
  }

  // Export canvas with the visible part
  const handleConfirm = async () => {
    if (!imgNatural) return
    const cw = containerSize.width
    const ch = containerSize.height

    const canvas = document.createElement("canvas")
    canvas.width = cw
    canvas.height = ch
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dw = displayed.width
    const dh = displayed.height
    const dx = (cw - dw) / 2 + pos.x
    const dy = (ch - dh) / 2 + pos.y

    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, cw, ch)
    ctx.imageSmoothingQuality = "high"

    ctx.drawImage(imgRef.current as HTMLImageElement, dx, dy, dw, dh)

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92)
    onCrop(dataUrl)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Adjust your photo</h3>
          <p className="text-sm text-gray-500">Pinch/drag to reposition. Use the slider to zoom. The crop is square.</p>
        </div>
        <div className="p-4">
          <div
            ref={containerRef}
            className="relative overflow-hidden bg-gray-100 rounded" 
            style={{ width: containerSize.width, height: containerSize.height, touchAction: "none", margin: "0 auto" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img
              ref={imgRef}
              src={src}
              onLoad={handleImageLoad}
              alt="To crop"
              draggable={false}
              className={`select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
              style={{
                position: "absolute",
                left: (containerSize.width - displayed.width) / 2 + pos.x,
                top: (containerSize.height - displayed.height) / 2 + pos.y,
                width: displayed.width,
                height: displayed.height,
                userSelect: "none",
                willChange: "left, top, width, height",
              }}
            />
            {/* Square frame overlay */}
            <div className="pointer-events-none absolute inset-0 border-2 border-white/70" />
            <div className="pointer-events-none absolute inset-0 bg-black/20" />
          </div>
          {/* Zoom slider */}
          <div className="mt-4 flex items-center space-x-3">
            <span className="text-xs text-gray-500">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={effectiveZoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        <div className="px-4 py-3 border-t flex justify-end space-x-2">
          <button onClick={onCancel} className="px-4 py-2 rounded border text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleConfirm} className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">Use photo</button>
        </div>
      </div>
    </div>
  )
}
