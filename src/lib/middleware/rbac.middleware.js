import { NextResponse } from 'next/server'
import { withAuth }     from './auth.middleware'

const ROLE_HIERARCHY = {
  super_admin:      100,
  regional_manager: 80,
  hospital_admin:   60,
  lab_admin:        60,
  doctor:           40,
  user:             20,
}

/**
 * Simple role check — throws if user doesn't have required role.
 * Used inside route handlers after auth is already verified.
 *
 * Usage:
 *   checkRole(user, 'super_admin', 'regional_manager')
 *   checkRole(user, ['super_admin', 'hospital_admin'])
 */
export function checkRole(user, ...allowedRoles) {
  if (!user) {
    throw new Error('Authentication required')
  }
  const flat = allowedRoles.flat()
  if (!flat.includes(user.role)) {
    throw new Error(
      `Access denied. Required: ${flat.join(' or ')}. Your role: ${user.role}`
    )
  }
  return true
}

/**
 * Check role without throwing — returns boolean.
 * Useful for conditional logic inside handlers.
 */
export function hasRole(user, ...allowedRoles) {
  if (!user) return false
  return allowedRoles.flat().includes(user.role)
}

/**
 * Check minimum role level — returns boolean.
 */
export function hasMinRole(user, minRole) {
  if (!user) return false
  const userLevel = ROLE_HIERARCHY[user.role] || 0
  const minLevel  = ROLE_HIERARCHY[minRole]   || 0
  return userLevel >= minLevel
}

/**
 * Middleware wrapper — requires one of the specified roles.
 *
 * Usage:
 *   return withRoles(request, ['super_admin', 'regional_manager'], handler)
 */
export function withRoles(request, allowedRoles, handler) {
  return withAuth(request, (req, user) => {
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error:   `Access denied. Required: ${allowedRoles.join(' or ')}`,
        },
        { status: 403 }
      )
    }
    return handler(req, user)
  })
}

/**
 * Middleware wrapper — requires minimum role level.
 *
 * Usage:
 *   return withMinRole(request, 'hospital_admin', handler)
 */
export function withMinRole(request, minRole, handler) {
  return withAuth(request, (req, user) => {
    const userLevel = ROLE_HIERARCHY[user.role] || 0
    const minLevel  = ROLE_HIERARCHY[minRole]   || 0

    if (userLevel < minLevel) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    return handler(req, user)
  })
}

/**
 * Middleware wrapper — requires super_admin role.
 */
export function withSuperAdmin(request, handler) {
  return withRoles(request, ['super_admin'], handler)
}

/**
 * Middleware wrapper — requires super_admin or regional_manager.
 */
export function withRegionalOrAbove(request, handler) {
  return withRoles(request, ['super_admin', 'regional_manager'], handler)
}

/**
 * Middleware wrapper — requires hospital_admin or above.
 */
export function withHospitalAdmin(request, handler) {
  return withRoles(
    request,
    ['super_admin', 'regional_manager', 'hospital_admin'],
    handler
  )
}

/**
 * Middleware wrapper — requires lab_admin or above.
 */
export function withLabAdmin(request, handler) {
  return withRoles(
    request,
    ['super_admin', 'regional_manager', 'lab_admin'],
    handler
  )
}

export default {
  checkRole,
  hasRole,
  hasMinRole,
  withRoles,
  withMinRole,
  withSuperAdmin,
  withRegionalOrAbove,
  withHospitalAdmin,
  withLabAdmin,
}