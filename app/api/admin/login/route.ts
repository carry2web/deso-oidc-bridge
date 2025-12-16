import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminPassword, setAdminCookie, ensureAdminExists } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Ensure default admin exists
    await ensureAdminExists()

    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const isValid = await verifyAdminPassword(username, password)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    await setAdminCookie()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
