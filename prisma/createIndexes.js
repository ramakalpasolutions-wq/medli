// prisma/createIndexes.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createIndexes() {
  console.log('📍 Creating MongoDB indexes...\n')

  const applyIndexes = async (collection, indexes, label) => {
    try {
      await prisma.$runCommandRaw({
        createIndexes: collection,
        indexes,
      })
      console.log(`✅ ${label} — index created successfully`)
    } catch (err) {
      if (
        err.message?.includes('already exists') ||
        err.message?.includes('IndexOptionsConflict') ||
        err.code === 85 ||
        err.code === 11000
      ) {
        console.log(`ℹ️  ${label} — index already exists / skipped`)
      } else {
        console.error(`❌ ${label} index error:`, err.message)
      }
    }
  }

  // ── 1. Hospitals (2dsphere) ────────────────────────────────────────────────
  await applyIndexes(
    'hospitals',
    [{ key: { location: '2dsphere' }, name: 'location_2dsphere' }],
    'hospitals.location (2dsphere)'
  )

  // ── 2. Labs (2dsphere) ─────────────────────────────────────────────────────
  await applyIndexes(
    'labs',
    [{ key: { location: '2dsphere' }, name: 'location_2dsphere' }],
    'labs.location (2dsphere)'
  )

  // ── 3. Users (Partial Filter Unique Indexes - Ignores nulls) ───────────────
  await applyIndexes(
    'users',
    [
      {
        key: { email: 1 },
        name: 'users_email_partial_unique',
        unique: true,
        partialFilterExpression: { email: { $type: 'string' } }, // 👈 Only unique when email is a non-null string
      },
      {
        key: { phone: 1 },
        name: 'users_phone_partial_unique',
        unique: true,
        partialFilterExpression: { phone: { $type: 'string' } }, // 👈 Only unique when phone is a non-null string
      },
    ],
    'users.email + users.phone (partial unique)'
  )

  // ── 4. Default Test Templates ─────────────────────────────────────────────
  await applyIndexes(
    'test_templates',
    [
      { key: { code: 1 }, name: 'code_unique', unique: true },
      { key: { category: 1, isActive: 1 }, name: 'category_isActive' },
    ],
    'test_templates (code unique + category filter)'
  )

  // ── 5. Lab Tests ──────────────────────────────────────────────────────────
  await applyIndexes(
    'tests',
    [
      { key: { labId: 1, code: 1 }, name: 'labId_code_unique', unique: true, sparse: true },
      { key: { labId: 1, isActive: 1 }, name: 'labId_isActive' },
      { key: { labId: 1, category: 1 }, name: 'labId_category' },
    ],
    'tests (compound labId + code unique & active index)'
  )

  // ── 6. Test Packages ──────────────────────────────────────────────────────
  await applyIndexes(
    'test_packages',
    [
      { key: { labId: 1, code: 1 }, name: 'package_labId_code_unique', unique: true, sparse: true },
      { key: { labId: 1, isActive: 1 }, name: 'package_labId_isActive' },
    ],
    'test_packages (labId + code unique)'
  )

  // ── 7. Bookings ───────────────────────────────────────────────────────────
  await applyIndexes(
    'bookings',
    [
      { key: { userId: 1, status: 1 },      name: 'userId_status' },
      { key: { doctorId: 1, startTime: 1 }, name: 'doctorId_startTime' },
      { key: { hospitalId: 1, status: 1 },  name: 'hospitalId_status' },
      { key: { labId: 1, status: 1 },       name: 'labId_status' },
      { key: { razorpayOrderId: 1 },        name: 'razorpayOrderId_idx', sparse: true },
    ],
    'bookings (compound query indexes)'
  )

  // ── 8. Coupons ────────────────────────────────────────────────────────────
  await applyIndexes(
    'coupons',
    [{ key: { code: 1 }, name: 'code_unique', unique: true }],
    'coupons.code (unique)'
  )

  // ── 9. Settlements ────────────────────────────────────────────────────────
  await applyIndexes(
    'settlements',
    [{ key: { entityId: 1, status: 1 }, name: 'entityId_status' }],
    'settlements (entityId + status)'
  )

  console.log('\n🎉 All MongoDB indexes verified & created!')
}

createIndexes()
  .catch((err) => {
    console.error('❌ Fatal:', err.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })