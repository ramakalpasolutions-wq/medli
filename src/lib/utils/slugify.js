import { prisma } from '@/lib/prisma'

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')         // Replace spaces with -
    .replace(/[^\w\-]+/g, '')     // Remove all non-word chars
    .replace(/\-\-+/g, '-')       // Replace multiple - with single -
    .replace(/^-+/, '')           // Trim - from start
    .replace(/-+$/, '')           // Trim - from end
}

export async function generateUniqueSlug(name, modelName) {
  let slug = slugify(name)
  
  // Check if slug exists in DB
  const existing = await prisma[modelName].findUnique({
    where: { slug }
  })

  if (existing) {
    // Append a 4-char random string to prevent collision
    const suffix = Math.random().toString(36).substring(2, 6)
    slug = `${slug}-${suffix}`
  }

  return slug
}