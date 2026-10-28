export function isUserProfileIncomplete(user) {
  if (user?.role !== 'user') return false

  const name = String(user.name || '').trim()
  const isPlaceholderName = /^user(?:\s+\d+)?$/i.test(name)

  return !name || isPlaceholderName || !String(user.email || '').trim()
}
