import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('\n🔧 Backfilling hospitalId on ALL hospital/online bookings...\n')

  // Get ALL bookings of type hospital/online (don't filter by null hospitalId)
  const bookings = await prisma.booking.findMany({
    where: {
      type: { in: ['hospital', 'online'] },
    },
    select: {
      id:         true,
      bookingId:  true,
      doctorId:   true,
      hospitalId: true,
    },
  })

  console.log(`Found ${bookings.length} hospital/online bookings total\n`)

  let fixed   = 0
  let skipped = 0
  let failed  = 0

  for (const b of bookings) {
    if (b.hospitalId) {
      console.log(`⏭️  ${b.bookingId} → already has hospitalId: ${b.hospitalId}`)
      skipped++
      continue
    }

    if (!b.doctorId) {
      console.log(`⚠️  ${b.bookingId} → no doctorId, cannot fix`)
      failed++
      continue
    }

    const doctor = await prisma.doctor.findUnique({
      where:  { id: b.doctorId },
      select: { hospitalId: true, name: true },
    })

    if (!doctor) {
      console.log(`❌ ${b.bookingId} → doctor ${b.doctorId} not found`)
      failed++
      continue
    }

    if (!doctor.hospitalId) {
      console.log(`❌ ${b.bookingId} → doctor "${doctor.name}" has no hospitalId`)
      failed++
      continue
    }

    await prisma.booking.update({
      where: { id: b.id },
      data:  { hospitalId: doctor.hospitalId },
    })

    console.log(`✅ ${b.bookingId} → hospitalId: ${doctor.hospitalId} (Dr. ${doctor.name})`)
    fixed++
  }

  console.log(`\n✨ Done!`)
  console.log(`   Fixed:   ${fixed}`)
  console.log(`   Skipped: ${skipped} (already had hospitalId)`)
  console.log(`   Failed:  ${failed}`)
  console.log()

  // Re-verify
  const guntur = await prisma.hospital.findFirst({
    where: { name: 'Guntur Government General Hospital' },
  })
  if (guntur) {
    const count = await prisma.booking.count({
      where: { hospitalId: guntur.id },
    })
    console.log(`🏥 Guntur Govt Hospital now has ${count} booking(s)\n`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())