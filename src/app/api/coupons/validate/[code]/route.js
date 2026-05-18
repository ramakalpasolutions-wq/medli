import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { validateCoupon } from '@/lib/services/coupon.service'
import { calculateDiscount } from '@/lib/services/pricing.service'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request, { params }) {
  try {
    const user = await verifyAuth(request)
    const { code } = await params
    const { searchParams } = new URL(request.url)

    const bookingType = searchParams.get('bookingType') || 'hospital'
    const amount = parseFloat(searchParams.get('amount') || '0')
    const entityId = searchParams.get('entityId') || ''

    const coupon = await validateCoupon({
      code,
      bookingType,
      amount,
      entityId,
      userId: user.userId,
    })

    const discountAmount = calculateDiscount(coupon, amount)

    return successResponse({
      valid: true,
      coupon: {
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        couponType: coupon.couponType,
      },
      discountAmount,
      message: `Coupon applied! You save ₹${discountAmount}`,
    })
  } catch (err) {
    return successResponse({
      valid: false,
      discountAmount: 0,
      message: err.message,
    })
  }
}