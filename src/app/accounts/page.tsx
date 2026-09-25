'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from '@/lib/auth/session-context'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import CrewSignupForm from '@/components/auth-forms/CrewSignupForm'
import EmployerSignupForm from '@/components/auth-forms/EmployerSignupForm'
import CrewLoginForm from '@/components/auth-forms/CrewLoginForm'
import EmployerLoginForm from '@/components/auth-forms/EmployerLoginForm'
import { createAuthClient } from '@/lib/auth/client'
import { setOAuthState, clearOAuthState } from '@/lib/oauthState'

function AccountsContent() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const intent = searchParams.get('intent') // e.g., 'post-requirement'
  const message = searchParams.get('message')
  const email = searchParams.get('email')
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(
    (searchParams.get('tab') as 'signin' | 'signup') || 'signup'
  )
  const [role, setRole] = useState<'crew' | 'employer'>(
    (searchParams.get('role') as 'crew' | 'employer') || (intent === 'post-requirement' ? 'employer' : 'crew')
  )
  const [isLoading, setIsLoading] = useState(false)

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userRole = session.user.role
      
      // Clear OAuth cookies after successful authentication
      clearOAuthState()
      
      // Redirect based on role and intent
      if (intent === 'post-requirement' && userRole === 'EMPLOYER') {
        router.push('/employer/post-requirement')
      } else if (intent === 'subscribe') {
        router.push('/subscription-plans')
      } else if (userRole === 'ADMIN') {
        router.push('/admin')
      } else if (userRole === 'CREW') {
        router.push('/crew-home')
      } else if (userRole === 'EMPLOYER') {
        router.push('/employer-home')
      } else {
        router.push('/')
      }
    }
  }, [session, status, router, intent])

  // Derived from the query string (set by the signup redirect) — no effect needed.
  const successMessage =
    message === 'RegistrationSuccessful' && email
      ? `Registration successful! Please check ${email} for a verification link.`
      : ''

  const handleTabChange = (tab: 'signin' | 'signup') => {
    setActiveTab(tab)
    const intentParam = intent ? `&intent=${intent}` : ''
    router.push(`/accounts?tab=${tab}&role=${role}${intentParam}`, { scroll: false })
  }

  const handleRoleChange = (newRole: 'crew' | 'employer') => {
    setRole(newRole)
    const intentParam = intent ? `&intent=${intent}` : ''
    router.push(`/accounts?tab=${activeTab}&role=${newRole}${intentParam}`, { scroll: false })
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)

    // Store role in cookies for retrieval during the OAuth callback
    const roleValue = role.toUpperCase() as 'CREW' | 'EMPLOYER'
    setOAuthState(roleValue, intent || undefined)

    try {
      const supabase = createAuthClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        console.error('Google sign-in failed:', error.message)
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Google sign-in failed:', err)
      setIsLoading(false)
    }
  }

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-800 via-purple-800 to-blue-700 text-white py-12 md:py-16">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute top-1/3 -right-16 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl animate-blob animation-delay-4000" />
        </div>
        
        <div className="relative container mx-auto px-4 text-center">
          {intent === 'post-requirement' && (
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 mb-4 text-sm">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Post a job requirement
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            {intent === 'post-requirement' 
              ? (activeTab === 'signup' ? 'Create Account to Post a Job' : 'Sign In to Post a Job')
              : (activeTab === 'signup' ? 'Create Your Account' : 'Welcome Back')
            }
          </h1>
          <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto">
            {intent === 'post-requirement'
              ? 'Create your employer account to post job requirements and connect with verified crew members'
              : role === 'crew' 
                ? 'Join thousands of film professionals finding their next opportunity'
                : 'Connect with verified crew members for your next production'
            }
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Benefits Only (no role selection) */}
              <div>
                <Card className="shadow-lg border-gray-200 h-full">
                  <CardContent className="p-6">
                    {/* Account Type Indicator */}
                    <div className="mb-6 pb-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{role === 'crew' ? '🎬' : '💼'}</div>
                          <div>
                            <h3 className="font-bold text-gray-900">
                              {role === 'crew' ? 'Crew Member Account' : 'Employer Account'}
                            </h3>
                            <p className="text-xs text-gray-600">
                              {role === 'crew' 
                                ? 'Looking for work on productions'
                                : 'Hiring crew for productions'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        Wrong account type?{' '}
                        <button
                          onClick={() => handleRoleChange(role === 'crew' ? 'employer' : 'crew')}
                          className="text-indigo-600 hover:text-indigo-700 font-semibold"
                        >
                          Switch to {role === 'crew' ? 'Employer' : 'Crew'}
                        </button>
                      </div>
                    </div>
                    {intent === 'post-requirement' && role === 'employer' && (
                      <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <h4 className="font-semibold text-indigo-900 text-sm mb-1">Ready to post your requirement?</h4>
                            <p className="text-xs text-indigo-700">After creating your account, you&apos;ll be redirected to post your job requirement immediately.</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Why Choose Us */}
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      {role === 'crew' ? 'Crew Member Benefits' : 'Employer Benefits'}
                    </h3>
                    <ul className="space-y-3">
                      {role === 'crew' ? (
                        <>
                          <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-700">Access to verified production opportunities</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-700">Showcase your portfolio and past projects</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-700">Get discovered by top production companies</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-700">Connect with other film professionals</span>
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-700">Access to verified, skilled crew members</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-700">Smart filtering by role, budget & location</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-700">Manage all applications in one place</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-700">Post requirements quickly with templates</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Form */}
              <div>
                <Card className="shadow-lg border-gray-200">
                  <CardContent className="p-6 md:p-8">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {activeTab === 'signup' 
                          ? `Create ${role === 'crew' ? 'Crew' : 'Employer'} Account`
                          : `Sign In as ${role === 'crew' ? 'Crew' : 'Employer'}`
                        }
                      </h2>
                      <p className="text-gray-600">
                        {activeTab === 'signup'
                          ? 'Fill in your details to get started'
                          : 'Welcome back! Please enter your credentials'
                        }
                      </p>
                    </div>

                    {/* Success Message */}
                    {successMessage && (
                      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-800">{successMessage}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Social Sign In */}
                    <div className="mb-6">
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-3 py-6 border-2 hover:bg-gray-50"
                        disabled={isLoading}
                        onClick={handleGoogleSignIn}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        {isLoading ? 'Connecting...' : `Continue with Google`}
                      </Button>

                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                        </div>
                      </div>
                    </div>

                    {/* Form */}
                    <div>
                      {activeTab === 'signup' ? (
                        role === 'crew' ? (
                          <CrewSignupForm />
                        ) : (
                          <EmployerSignupForm />
                        )
                      ) : (
                        role === 'crew' ? (
                          <CrewLoginForm />
                        ) : (
                          <EmployerLoginForm />
                        )
                      )}
                    </div>

                    {/* Footer Links */}
                    <div className="mt-6 text-center text-sm text-gray-600">
                      {activeTab === 'signup' ? (
                        <p>
                          Already have an account?{' '}
                          <button
                            onClick={() => handleTabChange('signin')}
                            className="text-indigo-600 hover:text-indigo-700 font-semibold"
                          >
                            Sign in
                          </button>
                        </p>
                      ) : (
                        <p>
                          Don&apos;t have an account?{' '}
                          <button
                            onClick={() => handleTabChange('signup')}
                            className="text-indigo-600 hover:text-indigo-700 font-semibold"
                          >
                            Create account
                          </button>
                        </p>
                      )}
                    </div>

                    <div className="mt-4 text-center text-xs text-gray-500">
                      By continuing, you agree to our{' '}
                      <Link href="/terms" className="text-indigo-600 hover:text-indigo-700">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/terms" className="text-indigo-600 hover:text-indigo-700">
                        Privacy Policy
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Trusted by Film Professionals Worldwide
              </h3>
              <p className="text-gray-600">Join the fastest-growing network for film and TV crew</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-indigo-50 rounded-xl">
                <div className="text-3xl font-bold text-indigo-600 mb-2">1,200+</div>
                <div className="text-sm text-gray-700">Active Crew Members</div>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-xl">
                <div className="text-3xl font-bold text-purple-600 mb-2">450+</div>
                <div className="text-sm text-gray-700">Projects Completed</div>
              </div>
              <div className="text-center p-6 bg-blue-50 rounded-xl">
                <div className="text-3xl font-bold text-blue-600 mb-2">180+</div>
                <div className="text-sm text-gray-700">Production Companies</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function AccountsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AccountsContent />
    </Suspense>
  )
}
