import { verifyAccessToken } from '@/lib/utils/jwt'
import prisma from '@/lib/prisma'

export async function verifyAuth(request) {
  const authHeader = request.headers.get('authorization') || ''
  let token = null

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim()
  }

  // Fallback to cookie
  if (!token) {
    const cookieHeader = request.headers.get('cookie') || ''
    const match        = cookieHeader.match(/(?:^|;\s*)accessToken=([^;]+)/)
    if (match) token   = match[1]
  }

  if (!token) {
    throw new Error('No authentication token provided')
  }

  let payload
  try {
    payload = verifyAccessToken(token)
  } catch {
    throw new Error('Invalid or expired access token')
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id:         true,
      name:       true,
      email:      true,
      phone:      true,
      role:       true,
      avatar:     true,
      isVerified: true,
      isBlocked:  true,
      wallet:     true,
      createdAt:  true,
      updatedAt:  true,
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  if (user.isBlocked) {
    throw new Error('Your account has been blocked. Please contact support.')
  }

  return user
}