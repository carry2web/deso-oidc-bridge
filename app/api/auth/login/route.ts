import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyDesoIdentity, getDesoProfile } from '@/lib/deso'
import { createSession, setSessionCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { publicKey } = await request.json()

    if (!publicKey || typeof publicKey !== 'string') {
      return NextResponse.json(
        { error: 'Invalid public key' },
        { status: 400 }
      )
    }

    // Verify DeSo identity
    const isValid = await verifyDesoIdentity({ publicKey })
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid DeSo public key format' },
        { status: 400 }
      )
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { desoPublicKey: publicKey },
    })

    // If user doesn't exist, create pending account
    if (!user) {
      const profile = await getDesoProfile(publicKey)
      
      user = await prisma.user.create({
        data: {
          desoPublicKey: publicKey,
          name: profile?.username || null,
          status: 'pending',
        },
      })
    }

    // Create session
    const sessionToken = await createSession(user.id)
    await setSessionCookie(sessionToken)

    return NextResponse.json({
      success: true,
      status: user.status,
      user: {
        id: user.id,
        desoPublicKey: user.desoPublicKey,
        name: user.name,
        status: user.status,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
