import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const limit = Math.max(parseInt(searchParams.get('limit') || '20', 10), 1)
    const status = (searchParams.get('status') || '').trim()
    const dateFrom = (searchParams.get('dateFrom') || '').trim()
    const dateTo = (searchParams.get('dateTo') || '').trim()
    const skip = (page - 1) * limit

    const where = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(`${dateFrom}T00:00:00.000Z`)
      if (dateTo) where.createdAt.lte = new Date(`${dateTo}T23:59:59.999Z`)
    }

    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.refund.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        refunds,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(Math.ceil(total / limit), 1),
        },
      },
    })
  } catch (error) {
    console.error('[GET /api/refunds] error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch refunds' },
      { status: 500 }
    )
  }
}