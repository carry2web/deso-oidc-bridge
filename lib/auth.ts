import { cookies } from 'next/headers'
import { prisma } from './db'
import { nanoid } from 'nanoid'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const SESSION_COOKIE_NAME = 'deso-oidc-session'
const ADMIN_COOKIE_NAME = 'deso-oidc-admin'
const SESSION_DURATION = 14 * 24 * 60 * 60 * 1000 // 14 days

export interface SessionUser {
  id: string
  desoPublicKey: string
  email?: string | null
  name?: string | null
  status: string
}

/**
 * Create a new user session
 */
export async function createSession(userId: string): Promise<string> {
  const sessionToken = nanoid(32)
  const expiresAt = new Date(Date.now() + SESSION_DURATION)

  await prisma.session.create({
    data: {
      userId,
      sessionToken,
      expiresAt,
    },
  })

  return sessionToken
}

/**
 * Get current session user
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionToken) {
    return null
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  return session.user
}

/**
 * Delete a session
 */
export async function deleteSession(sessionToken: string): Promise<void> {
  await prisma.session.delete({
    where: { sessionToken },
  }).catch(() => {
    // Ignore if session doesn't exist
  })
}

/**
 * Set session cookie
 */
export async function setSessionCookie(sessionToken: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  })
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Verify admin password
 */
export async function verifyAdminPassword(username: string, password: string): Promise<boolean> {
  const admin = await prisma.adminUser.findUnique({
    where: { username },
  })

  if (!admin) {
    return false
  }

  return bcrypt.compare(password, admin.passwordHash)
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const adminToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value

  if (!adminToken) {
    return false
  }

  try {
    // Verify the JWT token
    const secret = process.env.SESSION_SECRET || 'change-this-secret-key'
    const decoded = jwt.verify(adminToken, secret) as { username: string, exp: number }
    
    // Verify the user still exists in database
    const admin = await prisma.adminUser.findUnique({
      where: { username: decoded.username },
    })
    
    return !!admin
  } catch (error) {
    // Token is invalid or expired
    return false
  }
}

/**
 * Set admin cookie
 */
export async function setAdminCookie(username: string): Promise<void> {
  const cookieStore = await cookies()
  const secret = process.env.SESSION_SECRET || 'change-this-secret-key'
  
  // Create a JWT token with 8 hour expiration
  const adminToken = jwt.sign(
    { username, admin: true },
    secret,
    { expiresIn: '8h' }
  )
  
  cookieStore.set(ADMIN_COOKIE_NAME, adminToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60, // 8 hours
    path: '/',
  })
}

/**
 * Clear admin cookie
 */
export async function clearAdminCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE_NAME)
}

/**
 * Create initial admin user if none exists
 */
export async function ensureAdminExists(): Promise<void> {
  const adminCount = await prisma.adminUser.count()
  
  if (adminCount === 0) {
    const defaultPassword = 'admin123'
    const passwordHash = await bcrypt.hash(defaultPassword, 10)
    
    await prisma.adminUser.create({
      data: {
        username: 'admin',
        passwordHash,
      },
    })
    
    console.log('Created default admin user: admin / admin123')
    console.log('Please change the password immediately!')
  }
}
