import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('\n========== DEBUG HOSPITAL ADMIN BOOKINGS ==========\n')

  // 1. Find the hospital admin user
  const user = await prisma.user.findFirst({
    where: { email: 'admin@gunturhospital.in' },
  })
  console.log('1️⃣  USER:', user ? {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  } : '❌ NOT FOUND')

  if (!user) return

  // 2. Find hospital linked to this user
  const hospital = await prisma.hospital.findFirst({
    where: { adminUserId: user.id },
  })
  console.log('\n2️⃣  HOSPITAL LINKED via adminUserId:', hospital ? {
    id: hospital.id,
    name: hospital.name,
    adminUserId: hospital.adminUserId,
  } : '❌ NO HOSPITAL LINKED TO THIS USER')

  // 3. List ALL hospitals to see what's there
  const allHospitals = await prisma.hospital.findMany({
    select: { id: true, name: true, adminUserId: true },
  })
  console.log('\n3️⃣  ALL HOSPITALS IN DB:')
  console.table(allHospitals)

  // 4. Count bookings
  const totalBookings = await prisma.booking.count()
  console.log('\n4️⃣  TOTAL BOOKINGS IN DB:', totalBookings)

  // 5. Sample bookings with hospitalId
  const sampleBookings = await prisma.booking.findMany({
    take: 10,
    select: {
      id: true,
      bookingId: true,
      type: true,
      hospitalId: true,
      doctorId: true,
      status: true,
    },
  })
  console.log('\n5️⃣  SAMPLE BOOKINGS:')
  console.table(sampleBookings)

  // 6. If hospital found, count bookings for it
  if (hospital) {
    const hospitalBookings = await prisma.booking.count({
      where: { hospitalId: hospital.id },
    })
    console.log(`\n6️⃣  BOOKINGS FOR HOSPITAL "${hospital.name}":`, hospitalBookings)
  }

  console.log('\n===================================================\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())