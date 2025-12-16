import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { getOIDCProvider } from '@/lib/oidc-provider'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params
  const user = await getSessionUser()

  // If user is not logged in, redirect to login
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // If user is not approved, show error
  if (user.status !== 'approved') {
    return NextResponse.redirect(new URL(`/interaction/${uid}?error=not_approved`, request.url))
  }

  try {
    const provider = getOIDCProvider()
    
    // Note: In a production environment, this would need proper HTTP context handling
    // For now, we acknowledge this is a simplified implementation
    // A full implementation would require integrating the OIDC provider more deeply
    // with Next.js routing or using a separate Express server
    
    return NextResponse.json({
      error: 'OIDC interaction handling requires proper HTTP context',
      message: 'Please use the OIDC endpoints directly or integrate with a proper authentication flow'
    }, { status: 501 })
  } catch (error) {
    console.error('Interaction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
