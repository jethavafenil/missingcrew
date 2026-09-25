import { NextResponse } from 'next/server'
import { userRepo } from '@/lib/repo'
import bcrypt from 'bcryptjs'
import { requireRole } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/body'
import { z } from 'zod'

// Temporary API route for creating an admin user
// This should be removed after use for security reasons
export async function POST(request: Request) {
  try {
    const { requester } = await requireRole('ADMIN')
    const { email, password, name } = await parseBody(request, z.object({
      email: z.email().max(254),
      password: z.string().min(12).max(128),
      name: z.string().trim().min(1).max(100),
    }))

    // Check if user already exists
    const existingUser = await userRepo.findByEmail(email, requester)

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'User already exists',
          user: {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role
          }
        },
        { status: 409 }
      )
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin user
    const adminUser = await userRepo.createUser(
      {
        email,
        name,
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date()
      },
      requester
    )

    // Remove sensitive data before returning
    const { password: _, ...userWithoutPassword } = adminUser

    return NextResponse.json(
      {
        success: true,
        user: userWithoutPassword,
        message: 'Admin user created successfully'
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating admin user:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
