// prisma/createIndexes.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createIndexes() {
  console.log('📍 Creating MongoDB indexes...\n')

  // ── Hospitals ─────────────────────────────────────────────────────────────
  try {
    await prisma.$runCommandRaw({
      createIndexes: 'hospitals',
      indexes: [
        {
          key:  { location: '2dsphere' },
          name: 'location_2dsphere',
        },
      ],
    })
    console.log('✅ hospitals.location — 2dsphere index created')
  } catch (err) {
    if (err.message?.includes('already exists')) {
      console.log('ℹ️  hospitals.location — index already exists')
    } else {
      console.error('❌ hospitals index error:', err.message)
    }
  }

  // ── Labs ──────────────────────────────────────────────────────────────────
  try {
    await prisma.$runCommandRaw({
      createIndexes: 'labs',
      indexes: [
        {
          key:  { location: '2dsphere' },
          name: 'location_2dsphere',
        },
      ],
    })
    console.log('✅ labs.location — 2dsphere index created')
  } catch (err) {
    if (err.message?.includes('already exists')) {
      console.log('ℹ️  labs.location — index already exists')
    } else {
      console.error('❌ labs index error:', err.message)
    }
  }

  // ── Bookings ──────────────────────────────────────────────────────────────
  try {
    await prisma.$runCommandRaw({
      createIndexes: 'bookings',
      indexes: [
        { key: { userId: 1, status: 1 },      name: 'userId_status' },
        { key: { doctorId: 1, startTime: 1 }, name: 'doctorId_startTime' },
        { key: { hospitalId: 1, status: 1 },  name: 'hospitalId_status' },
        { key: { labId: 1, status: 1 },       name: 'labId_status' },
      ],
    })
    console.log('✅ bookings — compound indexes created')
  } catch (err) {
    if (err.message?.includes('already exists')) {
      console.log('ℹ️  bookings — indexes already exist')
    } else {
      console.error('❌ bookings index error:', err.message)
    }
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  try {
    await prisma.$runCommandRaw({
      createIndexes: 'users',
      indexes: [
        { key: { email: 1 }, name: 'email_unique', unique: true, sparse: true },
        { key: { phone: 1 }, name: 'phone_unique', unique: true, sparse: true },
      ],
    })
    console.log('✅ users — email + phone indexes created')
  } catch (err) {
    if (err.message?.includes('already exists')) {
      console.log('ℹ️  users — indexes already exist')
    } else {
      console.error('❌ users index error:', err.message)
    }
  }

  // ── Coupons ───────────────────────────────────────────────────────────────
  try {
    await prisma.$runCommandRaw({
      createIndexes: 'coupons',
      indexes: [
        { key: { code: 1 }, name: 'code_unique', unique: true },
      ],
    })
    console.log('✅ coupons — code unique index created')
  } catch (err) {
    if (err.message?.includes('already exists')) {
      console.log('ℹ️  coupons — index already exists')
    } else {
      console.error('❌ coupons index error:', err.message)
    }
  }

  // ── Settlements ───────────────────────────────────────────────────────────
  try {
    await prisma.$runCommandRaw({
      createIndexes: 'settlements',
      indexes: [
        { key: { entityId: 1, status: 1 }, name: 'entityId_status' },
      ],
    })
    console.log('✅ settlements — entityId+status index created')
  } catch (err) {
    if (err.message?.includes('already exists')) {
      console.log('ℹ️  settlements — index already exists')
    } else {
      console.error('❌ settlements index error:', err.message)
    }
  }

  console.log('\n🎉 All indexes done!')
}

createIndexes()
  .catch((err) => {
    console.error('❌ Fatal:', err.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })