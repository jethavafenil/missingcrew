import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { publicEnv } from '@/lib/public-env'
import { getSession } from '@/lib/auth/server'

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json()

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 },
      )
    }

    const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    // Verify the current password against GoTrue before updating.
    const anon = createClient(url, anonKey)
    const { data: login, error: loginError } = await anon.auth.signInWithPassword({
      email: session.user.email,
      password: currentPassword,
    })
    if (loginError || !login.session) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    const { error: updateError } = await anon.auth.updateUser({ password: newPassword })
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Password changed successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { error: 'An error occurred while changing password' },
      { status: 500 },
    )
  }
}
