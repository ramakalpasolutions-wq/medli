export function checkRole(user, ...allowedRoles) {
  if (!user) {
    throw new Error('Authentication required')
  }

  const flat = allowedRoles.flat()

  if (!flat.includes(user.role)) {
    throw new Error(
      `Access denied. Required role: ${flat.join(' or ')}. Your role: ${user.role}`
    )
  }

  return true
}