
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'

export const dynamic = 'force-dynamic'

function indiaDayRange() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const get = (type) => parts.find((part) => part.type === type)?.value
  const day = `${get('year')}-${get('month')}-${get('day')}`
  const start = new Date(`${day}T00:00:00.000+05:30`)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { day, start, end }
}

export async function GET(request) {
  try {
    const user = await verifyAuth(request)

    if (!user) {
      return Response.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    if (user.role !== 'hospital_admin') {
      return Response.json(
        { success: false, message: 'Hospital admin access required' },
        { status: 403 }
      )
    }

    const hospital = await prisma.hospital.findFirst({
      where: { adminUserId: user.userId || user.id },
      select: { id: true, name: true },
    })

    if (!hospital) {
      return Response.json(
        { success: false, message: 'No hospital assigned to this account' },
        { status: 404 }
      )
    }

    const { day, start, end } = indiaDayRange()
    const base = { hospitalId: hospital.id }
    const today = { ...base, startTime: { gte: start, lt: end } }
    const paid = { paymentStatus: 'paid' }

    const [
      totalBookings,
      allConfirmed,
      allCompleted,
      allOnline,
      todayBookings,
      todayConfirmed,
      todayCompleted,
      todayOnline,
      todayPaidAmount,
      allPaidAmount,
    ] = await Promise.all([
      prisma.booking.count({ where: base }),
      prisma.booking.count({ where: { ...base, status: 'confirmed' } }),
      prisma.booking.count({ where: { ...base, status: 'completed' } }),
      prisma.booking.count({ where: { ...base, type: 'online' } }),
      prisma.booking.count({ where: today }),
      prisma.booking.count({ where: { ...today, status: 'confirmed' } }),
      prisma.booking.count({ where: { ...today, status: 'completed' } }),
      prisma.booking.count({ where: { ...today, type: 'online' } }),
      prisma.booking.aggregate({
        where: { ...today, ...paid },
        _sum: { totalAmount: true },
      }),
      prisma.booking.aggregate({
        where: { ...base, ...paid },
        _sum: { totalAmount: true },
      }),
    ])

    return Response.json(
      {
        success: true,
        data: {
          hospitalId: hospital.id,
          date: day,
          today: {
            bookings: todayBookings,
            confirmed: todayConfirmed,
            completed: todayCompleted,
            online: todayOnline,
            paidAmount: Number(todayPaidAmount._sum.totalAmount ?? 0),
          },
          overall: {
            bookings: totalBookings,
            confirmed: allConfirmed,
            completed: allCompleted,
            online: allOnline,
            paidAmount: Number(allPaidAmount._sum.totalAmount ?? 0),
          },
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('[GET /api/hospital-admin/dashboard]', error)
    return Response.json(
      { success: false, message: 'Unable to load hospital statistics' },
      { status: 500 }
    )
  }
}
