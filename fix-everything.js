import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Helpers
const generateBookingId    = () => `BK-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`
const generateInvoiceNumber = () => `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`
const generateSettlementNumber = () => `STL-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`

async function main() {
  console.log('\n🔧 MEGA FIX: Bookings → Payments → Invoices → Settlements\n')

  // ── STEP 1: Mark confirmed/completed bookings as paid ──────────────
  console.log('1️⃣  Marking confirmed/completed bookings as PAID...')
  const updateResult = await prisma.booking.updateMany({
    where: {
      status:        { in: ['confirmed', 'completed'] },
      paymentStatus: { not: 'paid' },
    },
    data: { paymentStatus: 'paid' },
  })
  console.log(`   ✅ Updated ${updateResult.count} bookings to paid\n`)

  // ── STEP 2: Recalculate pricing fields if missing ──────────────────
  console.log('2️⃣  Backfilling pricing fields (totalAmount, platformFee, gst)...')
  const allBookings = await prisma.booking.findMany()
  let pricingFixed = 0
  for (const b of allBookings) {
    if (b.totalAmount > 0) continue // already has pricing

    const baseFee            = b.baseFee || 500              // default ₹500
    const platformFeePercent = b.platformFeePercent || 10
    const platformFee        = Math.round(baseFee * platformFeePercent / 100)
    const gstPercent         = 18
    const gst                = Math.round(platformFee * gstPercent / 100)
    const subtotal           = baseFee + platformFee + gst
    const totalAmount        = subtotal

    await prisma.booking.update({
      where: { id: b.id },
      data: {
        baseFee,
        platformFeePercent,
        platformFee,
        gstPercent,
        gst,
        subtotal,
        totalAmount,
        discountedFee: baseFee,
      },
    })
    pricingFixed++
  }
  console.log(`   ✅ Fixed pricing on ${pricingFixed} bookings\n`)

  // ── STEP 3: Create missing invoices ────────────────────────────────
  console.log('3️⃣  Creating missing invoices...')
  const bookings = await prisma.booking.findMany()
  let invoicesCreated = 0

  for (const b of bookings) {
    const existingInvoice = await prisma.invoice.findFirst({
      where: { bookingId: b.id },
    })
    if (existingInvoice) continue

    const entityType = b.type === 'lab' ? 'lab' : 'hospital'
    const entityId   = b.type === 'lab' ? b.labId : b.hospitalId

    if (!entityId) {
      console.log(`   ⚠️  Skipping ${b.bookingId} — no entityId`)
      continue
    }

    await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        bookingId:     b.id,
        userId:        b.userId,
        entityType,
        entityId,
        items: [
          {
            description: b.type === 'lab' ? 'Lab Tests' : 'Consultation Fee',
            quantity:    1,
            rate:        b.baseFee,
            amount:      b.baseFee,
          },
        ],
        baseFee:             b.baseFee,
        couponCode:          b.couponCode,
        couponDiscount:      b.couponDiscount,
        couponType:          b.couponType,
        discountedFee:       b.discountedFee,
        platformFeePercent:  b.platformFeePercent,
        platformFee:         b.platformFee,
        gstPercent:          b.gstPercent,
        gst:                 b.gst,
        subtotal:            b.subtotal,
        adminCouponDiscount: b.adminCouponDiscount,
        totalAmount:         b.totalAmount,
        gstDetails: {
          medliGstin: '29ABCDE1234F1Z5',
          hsnCode:    b.type === 'lab' ? '998931' : '999311',
          gstRate:    18,
        },
        paymentMethod: 'card',
        paymentMode:   'Online',
        type:          'invoice',
      },
    })
    invoicesCreated++
  }
  console.log(`   ✅ Created ${invoicesCreated} invoices\n`)

  // ── STEP 4: Create sample completed settlements per hospital ───────
  console.log('4️⃣  Creating sample completed settlements...')
  const hospitals = await prisma.hospital.findMany({
    where: { adminUserId: { not: null } },
  })

  let settlementsCreated = 0
  for (const h of hospitals) {
    const paidBookings = await prisma.booking.findMany({
      where: {
        hospitalId:    h.id,
        paymentStatus: 'paid',
        isSettled:     false,
        status:        { in: ['confirmed', 'completed'] },
      },
    })

    if (paidBookings.length === 0) {
      console.log(`   ⏭️  ${h.name} → no paid bookings`)
      continue
    }

    // Take older half as "settled history"
    const halfCount = Math.ceil(paidBookings.length / 2)
    const toSettle  = paidBookings.slice(0, halfCount)

    const grossAmount         = toSettle.reduce((s, b) => s + (b.totalAmount || 0), 0)
    const platformFee         = toSettle.reduce((s, b) => s + (b.platformFee || 0), 0)
    const gst                 = toSettle.reduce((s, b) => s + (b.gst || 0), 0)
    const refundsDeducted     = toSettle.reduce((s, b) => s + (b.refundAmount || 0), 0)
    const netSettlementAmount = grossAmount - refundsDeducted

    const settlement = await prisma.settlement.create({
      data: {
        settlementNumber:    generateSettlementNumber(),
        entityType:          'hospital',
        entityId:            h.id,
        entityName:          h.name,
        periodFrom:          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        periodTo:            new Date(),
        totalBookings:       toSettle.length,
        grossAmount,
        platformFee,
        gst,
        couponAbsorbed:      0,
        refundsDeducted,
        netSettlementAmount,
        bankAccountId:       h.bankAccountId,
        beneficiaryName:     h.name,
        beneficiaryAccount:  '123456789012',
        beneficiaryIFSC:     'HDFC0001234',
        bankName:            'HDFC Bank',
        transferMode:        'IMPS',
        utrNumber:           `UTR${Date.now()}`,
        transferredAt:       new Date(),
        status:              'completed',
        bookingIds:          toSettle.map((b) => b.id),
      },
    })

    // Mark these bookings as settled
    await prisma.booking.updateMany({
      where: { id: { in: toSettle.map((b) => b.id) } },
      data:  { isSettled: true, settlementId: settlement.id },
    })

    console.log(`   ✅ ${h.name} → settlement ${settlement.settlementNumber} (${toSettle.length} bookings, ₹${netSettlementAmount})`)
    settlementsCreated++
  }
  console.log(`\n   ✅ Created ${settlementsCreated} settlements\n`)

  // ── FINAL VERIFICATION ─────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════')
  console.log('📊 FINAL DATABASE STATE:')
  console.log(`   Bookings:    ${await prisma.booking.count()}`)
  console.log(`   Invoices:    ${await prisma.invoice.count()}`)
  console.log(`   Settlements: ${await prisma.settlement.count()}`)
  console.log('═══════════════════════════════════════════════════════\n')
}

main()
  .catch((err) => { console.error('❌ Error:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())