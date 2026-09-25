import '@testing-library/jest-dom/vitest'

// Clean up DOM between tests (RTL handles render cleanup; this covers stray
// globals like the body-overflow lock ApplyModal toggles).
import { afterEach } from 'vitest'

afterEach(() => {
  document.body.style.overflow = ''
})

// jsdom lacks window.matchMedia; some UI primitives (next-themes etc.) read it.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}
