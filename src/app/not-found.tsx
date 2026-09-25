import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full text-center">
        {/* Animated background blobs */}
        <div className="relative">
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl animate-blob" />
          <div className="absolute -top-10 -right-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-10 left-1/3 w-56 h-56 rounded-full bg-blue-500/10 blur-2xl animate-blob animation-delay-4000" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* 404 Text */}
          <div className="mb-8">
            <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-fade-in">
              404
            </h1>
          </div>

          {/* Message */}
          <div className="mb-8 animate-fade-in-up animation-delay-500">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Page Not Found
            </h2>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              Oops! The page you&apos;re looking for seems to have gone off-script. Let&apos;s get you back on track.
            </p>
          </div>

          {/* Film-themed illustration */}
          <div className="mb-12 animate-fade-in-up animation-delay-1000">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 border-4 border-white shadow-xl">
              <svg
                className="w-16 h-16 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                />
              </svg>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-1500">
            <Link href="/">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                <Home className="w-5 h-5" />
                Back to Home
              </Button>
            </Link>
            <Link href="/browse-crew">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                <Search className="w-5 h-5" />
                Browse Crew
              </Button>
            </Link>
          </div>

          {/* Quick Links */}
          <div className="mt-12 pt-8 border-t border-gray-200 animate-fade-in-up animation-delay-2000">
            <p className="text-sm text-gray-500 mb-4">Popular pages:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/find-work" className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">
                Find Work
              </Link>
              <span className="text-gray-300">•</span>
              <Link href="/subscription-plans" className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">
                Subscription Plans
              </Link>
              <span className="text-gray-300">•</span>
              <Link href="/about" className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">
                About Us
              </Link>
              <span className="text-gray-300">•</span>
              <Link href="/contact" className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
