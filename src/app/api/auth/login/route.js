import prisma from '@/lib/prisma'
import { comparePassword }      from '@/lib/utils/encryption'
import { generateAccessToken, generateRefreshToken } from '@/lib/utils/jwt'
import { isValidEmail, isValidPhone, sanitizeInput } from '@/lib/utils/validators'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function POST(request) {
  try {
    const body = await request.json()

    const email    = sanitizeInput(body.email || '').toLowerCase()
    const phone    = sanitizeInput(body.phone || '')
    const password = body.password || ''

    if (!email && !phone)
      return errorResponse('Email or phone is required', 'VALIDATION_ERROR', 400)

    if (!password)
      return errorResponse('Password is required', 'VALIDATION_ERROR', 400)

    // Find user
    let whereClause = {}
    if (email && isValidEmail(email))       whereClause = { email }
    else if (phone && isValidPhone(phone))  whereClause = { phone }
    else return errorResponse('Invalid email or phone format', 'VALIDATION_ERROR', 400)

    const user = await prisma.user.findUnique({ where: whereClause })

    if (!user || !user.passwordHash)
      return errorResponse('Invalid credentials', 'INVALID_CREDENTIALS', 401)

    const isMatch = await comparePassword(password, user.passwordHash)
    if (!isMatch)
      return errorResponse('Invalid credentials', 'INVALID_CREDENTIALS', 401)

    if (user.isBlocked)
      return errorResponse(
        'Your account has been blocked. Please contact support.',
        'ACCOUNT_BLOCKED',
        403
      )

    const tokenPayload = { id: user.id, role: user.role }
    const accessToken  = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    // Strip passwordHash
    const { passwordHash: _ph, ...safeUser } = user

    const response = successResponse(
      { user: safeUser, accessToken, refreshToken },
      'Login successful'
    )

    // Set both tokens as httpOnly cookies
    response.headers.append(
      'Set-Cookie',
      `accessToken=${accessToken}; HttpOnly; Path=/; Max-Age=900; SameSite=Strict`
    )
    response.headers.append(
      'Set-Cookie',
      `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`
    )

    return response
  } catch (err) {
    console.error('[Login]', err.message)
    return errorResponse('Login failed', 'SERVER_ERROR', 500)
  }
}