'use client'

import { useRef, useState, useEffect } from 'react'

export function FallbackCrewSlider() {
  const sliderRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [visibleCardsCount, setVisibleCardsCount] = useState(3)
  const [cardWidth, setCardWidth] = useState(300) // Default card width
  // Deterministic per-card experience values (stable across renders, unlike
  // Math.random() during render which the react-hooks/purity rule forbids).
  const cardExperience = [12, 7, 15, 9, 18, 6, 11, 14, 8, 10]

  // Check if the device is mobile and update visible cards count
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)

      // Update visible cards count based on screen size
      if (width < 768) {
        setVisibleCardsCount(1)
        setCardWidth(width - 24) // Full width minus padding
      } else if (width < 1024) {
        setVisibleCardsCount(2)
        setCardWidth((width - 32) / 2) // Half width minus padding and spacing
      } else {
        setVisibleCardsCount(3)
        setCardWidth((width - 48) / 3) // Third width minus padding and spacing
      }
    }

    // Initial check
    handleResize()

    // Add event listener for window resize
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Scroll to a specific card index
  const scrollToIndex = (index: number) => {
    if (!sliderRef.current) return

    const maxIndex = Math.max(0, 10 - visibleCardsCount) // 10 is the number of mock cards

    // Ensure index is within bounds
    const newIndex = Math.max(0, Math.min(index, maxIndex))
    setCurrentIndex(newIndex)

    // Calculate scroll position
    const scrollPosition = newIndex * (cardWidth + 24) // Add spacing

    // Smooth scroll to the position
    sliderRef.current.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    })
  }

  // Handle left scroll
  const scrollLeft = () => {
    scrollToIndex(currentIndex - 1)
  }

  // Handle right scroll
  const scrollRight = () => {
    scrollToIndex(currentIndex + 1)
  }

  // Initialize slider on mount and re-align when the layout changes
  useEffect(() => {
    if (sliderRef.current) {
      // Set initial scroll position
      scrollToIndex(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCardsCount, cardWidth])

  return (
    <div className="relative group">
      {/* Slider container */}
      <div className="overflow-hidden">
        <div
          ref={sliderRef}
          className="flex space-x-6 pb-6"
          id="crew-slider-fallback"
          style={{ minHeight: '400px' }}
        >
          {/* Mock crew cards - 10 total */}
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="flex-shrink-0"
              style={{
                width: `${cardWidth}px`,
                minWidth: `${cardWidth}px`,
                height: '100%'
              }}
            >
              <div className="rounded-lg shadow-sm border hover:shadow-md transition-shadow bg-white flex flex-col" style={{ height: '400px' }}>
                <div className="p-5 border-b bg-gradient-to-r from-blue-900/10 to-indigo-900/10">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        <span className="text-gray-400 text-xl">{String.fromCharCode(65 + index)}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {index === 0 && "Cinematographer"}
                        {index === 1 && "Lighting Specialist"}
                        {index === 2 && "Sound Engineer"}
                        {index === 3 && "Production Designer"}
                        {index === 4 && "Camera Operator"}
                        {index === 5 && "Gaffer"}
                        {index === 6 && "Makeup Artist"}
                        {index === 7 && "Costume Designer"}
                        {index === 8 && "Editor"}
                        {index === 9 && "Director of Photography"}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {index === 0 && "Camera Operator, Director of Photography"}
                        {index === 1 && "Gaffer, Lighting Technician"}
                        {index === 2 && "Audio Technician, Boom Operator"}
                        {index === 3 && "Set Designer, Art Director"}
                        {index === 4 && "Camera Assistant, Focus Puller"}
                        {index === 5 && "Key Grip, Best Boy"}
                        {index === 6 && "Special Effects, Prosthetics"}
                        {index === 7 && "Wardrobe, Stylist"}
                        {index === 8 && "Video Editor, Colorist"}
                        {index === 9 && "DP, Camera Supervisor"}
                      </p>
                    </div>
                  </div>
                </div>
              <div className="p-5" style={{ minHeight: '180px' }}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">Location:</span>
                    <span className="text-sm text-gray-600">
                      {index === 0 && "Los Angeles, CA"}
                      {index === 1 && "New York, NY"}
                      {index === 2 && "Atlanta, GA"}
                      {index === 3 && "Chicago, IL"}
                      {index === 4 && "Miami, FL"}
                      {index === 5 && "Toronto, ON"}
                      {index === 6 && "Vancouver, BC"}
                      {index === 7 && "London, UK"}
                      {index === 8 && "Sydney, AU"}
                      {index === 9 && "Paris, FR"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Experience:</span>
                    <span className="text-sm text-gray-600">
                      {cardExperience[index]}+ years
                    </span>
                  </div>
                </div>
                <div className="p-5 border-t bg-gray-50">
                  <div className="flex justify-center">
                    <div className="px-4 py-2 bg-gray-200 rounded-md text-sm text-gray-700">
                      View Profile
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation buttons - always visible on mobile */}
      <button
        className={`absolute top-1/2 -left-4 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md z-10 transition-opacity ${
          isMobile ? 'opacity-100' : 'group-hover:opacity-100 opacity-0'
        } ${currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
        onClick={scrollLeft}
        aria-label="Previous crew members"
        disabled={currentIndex === 0}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        className={`absolute top-1/2 -right-4 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md z-10 transition-opacity ${
          isMobile ? 'opacity-100' : 'group-hover:opacity-100 opacity-0'
        } ${currentIndex >= 10 - visibleCardsCount ? 'opacity-30 cursor-not-allowed' : ''}`}
        onClick={scrollRight}
        aria-label="Next crew members"
        disabled={currentIndex >= 10 - visibleCardsCount}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Pagination dots for mobile */}
      {isMobile && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: 10 }).map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
              onClick={() => scrollToIndex(index)}
              aria-label={`Go to crew member ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
