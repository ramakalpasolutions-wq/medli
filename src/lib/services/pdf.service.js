// src/lib/services/pdf.service.js
import PDFDocument from 'pdfkit'

// PDFKit default fonts don't render ₹ — use "Rs." as safe fallback
const RS = 'Rs.'

function formatAmount(amount) {
  const num = Number(amount || 0)
  return `${RS} ${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  })
}

// ── Colors ────────────────────────────────────────────────────────────────────
const COLORS = {
  primary:   '#1a56db',
  primaryBg: '#eff6ff',
  dark:      '#111827',
  text:      '#374151',
  muted:     '#6b7280',
  light:     '#9ca3af',
  border:    '#e5e7eb',
  success:   '#059669',
  successBg: '#ecfdf5',
  white:     '#ffffff',
  tableBg:   '#f9fafb',
  red:       '#dc2626',
}

function drawLine(doc, x1, y, x2, color = COLORS.border, width = 0.5) {
  doc.strokeColor(color).lineWidth(width).moveTo(x1, y).lineTo(x2, y).stroke()
}

function drawRect(doc, x, y, w, h, fill) {
  doc.save().fillColor(fill).rect(x, y, w, h).fill().restore()
}

function drawRoundedRect(doc, x, y, w, h, radius, fill) {
  doc.save().fillColor(fill).roundedRect(x, y, w, h, radius).fill().restore()
}

// ── Main PDF Generator ────────────────────────────────────────────────────────
export async function generateInvoicePDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size:   'A4',
        margin: 0,
        info: {
          Title:   `Invoice ${data.invoiceNumber || ''}`,
          Author:  'MEDLI Healthcare',
          Subject: 'Invoice / Tax Receipt',
          Creator: 'MEDLI Platform',
        },
      })

      const chunks = []
      doc.on('data',  (chunk) => chunks.push(chunk))
      doc.on('end',   () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const PAGE_W  = 595.28
      const MARGIN  = 48
      const CONTENT = PAGE_W - MARGIN * 2
      let y         = 0

      // ════════════════════════════════════════════════════════════════════════
      // HEADER — Blue bar
      // ════════════════════════════════════════════════════════════════════════
      const HEADER_H = 110
      drawRect(doc, 0, 0, PAGE_W, HEADER_H, COLORS.primary)
      drawRect(doc, 0, 0, PAGE_W, 4, '#1e40af')

      doc.font('Helvetica-Bold')
        .fontSize(24)
        .fillColor(COLORS.white)
        .text('MEDLI', MARGIN, 32, { width: CONTENT / 2 })

      doc.font('Helvetica')
        .fontSize(8)
        .fillColor('#bfdbfe')
        .text('Healthcare Platform', MARGIN, 58, { width: CONTENT / 2 })

      const isCredit = data.type === 'credit_note'
      const docLabel = isCredit ? 'CREDIT NOTE' : 'TAX INVOICE'

      doc.font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(COLORS.white)
        .text(docLabel, PAGE_W - MARGIN - 200, 32, { width: 200, align: 'right' })

      doc.font('Helvetica')
        .fontSize(9)
        .fillColor('#bfdbfe')
        .text(`#${data.invoiceNumber || '—'}`, PAGE_W - MARGIN - 200, 48, {
          width: 200, align: 'right',
        })

      doc.font('Helvetica')
        .fontSize(8)
        .fillColor('#93c5fd')
        .text(`Date: ${formatDate(data.createdAt)}`, PAGE_W - MARGIN - 200, 63, {
          width: 200, align: 'right',
        })

      if (data.bookingId) {
        doc.text(`Booking: ${data.bookingId}`, PAGE_W - MARGIN - 200, 76, {
          width: 200, align: 'right',
        })
      }

      y = HEADER_H + 28

      // ════════════════════════════════════════════════════════════════════════
      // FROM / TO
      // ════════════════════════════════════════════════════════════════════════
      const COL_W  = (CONTENT - 20) / 2
      const CARD_H = 85
      const CARD_R = 6

      // FROM
      drawRoundedRect(doc, MARGIN, y, COL_W, CARD_H, CARD_R, COLORS.tableBg)
      doc.font('Helvetica-Bold').fontSize(7).fillColor(COLORS.primary)
        .text('FROM', MARGIN + 14, y + 12, { width: COL_W - 28 })

      const providerName = data.entityDetails?.name || 'MEDLI Healthcare Pvt. Ltd.'
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.dark)
        .text(providerName, MARGIN + 14, y + 26, { width: COL_W - 28 })

      const providerLines = []
      if (data.entityDetails?.address) {
        const a = data.entityDetails.address
        if (a.line1)   providerLines.push(a.line1)
        if (a.city)    providerLines.push(`${a.city}${a.state ? ', ' + a.state : ''}`)
        if (a.pinCode) providerLines.push(`PIN: ${a.pinCode}`)
      }
      if (data.gstDetails?.providerGstin) {
        providerLines.push(`GSTIN: ${data.gstDetails.providerGstin}`)
      } else if (data.gstDetails?.medliGstin || process.env.MEDLI_GSTIN) {
        providerLines.push(
          `GSTIN: ${data.gstDetails?.medliGstin || process.env.MEDLI_GSTIN}`
        )
      }

      doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.muted)
      let pY = y + 42
      providerLines.forEach((line) => {
        doc.text(line, MARGIN + 14, pY, { width: COL_W - 28 })
        pY += 11
      })

      // TO (Patient)
      const toX = MARGIN + COL_W + 20
      drawRoundedRect(doc, toX, y, COL_W, CARD_H, CARD_R, COLORS.tableBg)
      doc.font('Helvetica-Bold').fontSize(7).fillColor(COLORS.success)
        .text('BILLED TO', toX + 14, y + 12, { width: COL_W - 28 })

      const patientName = data.userDetails?.name || '—'
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.dark)
        .text(patientName, toX + 14, y + 26, { width: COL_W - 28 })

      const patientLines = []
      if (data.userDetails?.email) patientLines.push(data.userDetails.email)
      if (data.userDetails?.phone) patientLines.push(`Ph: ${data.userDetails.phone}`)

      doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.muted)
      let patY = y + 42
      patientLines.forEach((line) => {
        doc.text(line, toX + 14, patY, { width: COL_W - 28 })
        patY += 11
      })

      y += CARD_H + 24

      // ════════════════════════════════════════════════════════════════════════
      // BOOKING INFO STRIP
      // ════════════════════════════════════════════════════════════════════════
      drawRoundedRect(doc, MARGIN, y, CONTENT, 32, 4, COLORS.primaryBg)

      const infoItems = [
        { label: 'Type',    value: (data.bookingType || data.type || 'consultation').toUpperCase() },
        { label: 'Date',    value: formatDate(data.createdAt) },
        { label: 'Payment', value: '1PAY GATEWAY' },
        { label: 'Status',  value: 'PAID' },
      ]

      const infoW = CONTENT / infoItems.length
      infoItems.forEach((item, i) => {
        const ix = MARGIN + i * infoW
        doc.font('Helvetica').fontSize(6.5).fillColor(COLORS.primary)
          .text(item.label, ix + 12, y + 7, { width: infoW - 24 })
        doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.dark)
          .text(item.value, ix + 12, y + 17, { width: infoW - 24 })
      })

      y += 52

      // ════════════════════════════════════════════════════════════════════════
      // CHARGES TABLE
      // ════════════════════════════════════════════════════════════════════════
      const TABLE_X = MARGIN
      const DESC_W  = CONTENT * 0.55
      const QTY_W   = CONTENT * 0.12
      const RATE_W  = CONTENT * 0.16
      const AMT_W   = CONTENT * 0.17
      const ROW_H   = 28

      // Header
      drawRoundedRect(doc, TABLE_X, y, CONTENT, ROW_H, 4, COLORS.primary)
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(COLORS.white)
      doc.text('DESCRIPTION',  TABLE_X + 12,                    y + 10, { width: DESC_W - 12 })
      doc.text('QTY',          TABLE_X + DESC_W,                y + 10, { width: QTY_W,  align: 'center' })
      doc.text('RATE',         TABLE_X + DESC_W + QTY_W,        y + 10, { width: RATE_W, align: 'right' })
      doc.text('AMOUNT',       TABLE_X + DESC_W + QTY_W + RATE_W, y + 10, { width: AMT_W - 12, align: 'right' })
      y += ROW_H

      // Items
      const items = data.items && data.items.length > 0
        ? data.items
        : [{
            description: data.type === 'lab' ? 'Lab Test' : 'Consultation Fee',
            quantity:    1,
            rate:        data.baseFee || 0,
            amount:      data.baseFee || 0,
          }]

      items.forEach((item, i) => {
        if (i % 2 === 0) drawRect(doc, TABLE_X, y, CONTENT, ROW_H, COLORS.tableBg)

        doc.font('Helvetica').fontSize(8).fillColor(COLORS.dark)
          .text(item.description || '—', TABLE_X + 12, y + 9, { width: DESC_W - 24 })

        doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted)
          .text(String(item.quantity || 1), TABLE_X + DESC_W, y + 9, { width: QTY_W, align: 'center' })
          .text(formatAmount(item.rate),    TABLE_X + DESC_W + QTY_W, y + 9, { width: RATE_W, align: 'right' })

        doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.dark)
          .text(formatAmount(item.amount), TABLE_X + DESC_W + QTY_W + RATE_W, y + 9, {
            width: AMT_W - 12, align: 'right',
          })

        y += ROW_H
      })

      drawLine(doc, TABLE_X, y, TABLE_X + CONTENT, COLORS.border, 0.5)
      y += 8

      // ════════════════════════════════════════════════════════════════════════
      // SUMMARY — Right-aligned
      // ════════════════════════════════════════════════════════════════════════
      const SUM_X   = TABLE_X + CONTENT * 0.50
      const SUM_W   = CONTENT * 0.50
      const LABEL_W = SUM_W * 0.58
      const VALUE_W = SUM_W * 0.42

      const summaryLines = []

      summaryLines.push({ label: 'Base Fee', value: formatAmount(data.baseFee) })

      if (data.couponDiscount > 0) {
        summaryLines.push({
          label: `Coupon Discount${data.couponCode ? ` (${data.couponCode})` : ''}`,
          value: `- ${formatAmount(data.couponDiscount)}`,
          color: COLORS.success,
        })
      }

      if (data.discountedFee != null && data.discountedFee !== data.baseFee) {
        summaryLines.push({
          label: 'Discounted Fee',
          value: formatAmount(data.discountedFee),
        })
      }

      if (data.platformFee > 0) {
        summaryLines.push({
          label: `Platform Fee${data.platformFeePercent ? ` (${data.platformFeePercent}%)` : ''}`,
          value: formatAmount(data.platformFee),
        })
      }

      if (data.gst > 0) {
        summaryLines.push({
          label: `GST${data.gstPercent ? ` (${data.gstPercent}%)` : ''}`,
          value: formatAmount(data.gst),
        })
      }

      if (data.subtotal > 0 && data.adminCouponDiscount > 0) {
        summaryLines.push({ label: 'Subtotal', value: formatAmount(data.subtotal) })
      }

      if (data.adminCouponDiscount > 0) {
        summaryLines.push({
          label: 'Platform Coupon Discount',
          value: `- ${formatAmount(data.adminCouponDiscount)}`,
          color: COLORS.success,
        })
      }

      summaryLines.forEach((line) => {
        doc.font(line.bold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(8)
          .fillColor(line.color || COLORS.muted)
          .text(line.label, SUM_X, y, { width: LABEL_W })

        doc.font(line.bold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(8)
          .fillColor(line.color || COLORS.dark)
          .text(line.value, SUM_X + LABEL_W, y, { width: VALUE_W, align: 'right' })

        y += 16
      })

      y += 4

      // Total box
      drawRoundedRect(doc, SUM_X - 4, y, SUM_W + 8, 32, 4, COLORS.primary)
      doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.white)
        .text('TOTAL AMOUNT', SUM_X + 8, y + 10, { width: LABEL_W - 8 })
      doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.white)
        .text(formatAmount(data.totalAmount), SUM_X + LABEL_W, y + 9, {
          width: VALUE_W - 4, align: 'right',
        })

      y += 48

      // Refund line (credit note)
      if (data.refundAmount > 0 || (isCredit && data.totalAmount > 0)) {
        const refAmt = data.refundAmount || data.totalAmount || 0
        drawRoundedRect(doc, SUM_X - 4, y - 8, SUM_W + 8, 28, 4, COLORS.successBg)

        doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.success)
          .text('REFUND AMOUNT', SUM_X + 8, y, { width: LABEL_W - 8 })
        doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.success)
          .text(formatAmount(refAmt), SUM_X + LABEL_W, y, {
            width: VALUE_W - 4, align: 'right',
          })

        y += 36
      }

      // ════════════════════════════════════════════════════════════════════════
      // PAYMENT REFERENCE — 1Pay fields (replaces HDFC)
      // ════════════════════════════════════════════════════════════════════════
      const pgRef = data.onePayPgRefId || data.onePayTxnId

      if (pgRef) {
        y += 4
        drawRoundedRect(doc, MARGIN, y, CONTENT, 28, 4, COLORS.tableBg)

        doc.font('Helvetica').fontSize(7).fillColor(COLORS.muted)
          .text('Payment Gateway:', MARGIN + 12, y + 6)
        doc.font('Helvetica-Bold').fontSize(7).fillColor(COLORS.dark)
          .text('1Pay Payment Gateway', MARGIN + 100, y + 6)

        doc.font('Helvetica').fontSize(7).fillColor(COLORS.muted)
          .text('Reference:', MARGIN + 12, y + 16)
        doc.font('Helvetica-Bold').fontSize(7).fillColor(COLORS.dark)
          .text(pgRef, MARGIN + 60, y + 16)

        if (data.paymentMode) {
          doc.font('Helvetica').fontSize(7).fillColor(COLORS.muted)
            .text('Mode:', MARGIN + CONTENT * 0.55, y + 16)
          doc.font('Helvetica-Bold').fontSize(7).fillColor(COLORS.dark)
            .text(data.paymentMode.toUpperCase(), MARGIN + CONTENT * 0.55 + 35, y + 16)
        }

        y += 38
      }

      // ════════════════════════════════════════════════════════════════════════
      // GST DETAILS
      // ════════════════════════════════════════════════════════════════════════
      if (data.gstDetails?.hsnCode || data.gstDetails?.gstRate) {
        drawRoundedRect(doc, MARGIN, y, CONTENT, 28, 4, COLORS.tableBg)

        let gstX = MARGIN + 12
        if (data.gstDetails.hsnCode) {
          doc.font('Helvetica').fontSize(7).fillColor(COLORS.muted)
            .text('HSN/SAC:', gstX, y + 9)
          doc.font('Helvetica-Bold').fontSize(7).fillColor(COLORS.dark)
            .text(data.gstDetails.hsnCode, gstX + 50, y + 9)
          gstX += 130
        }
        if (data.gstDetails.medliGstin) {
          doc.font('Helvetica').fontSize(7).fillColor(COLORS.muted)
            .text('MEDLI GSTIN:', gstX, y + 9)
          doc.font('Helvetica-Bold').fontSize(7).fillColor(COLORS.dark)
            .text(data.gstDetails.medliGstin, gstX + 70, y + 9)
        }

        y += 38
      }

      // ════════════════════════════════════════════════════════════════════════
      // FOOTER
      // ════════════════════════════════════════════════════════════════════════
      const FOOTER_Y = 760

      drawLine(doc, MARGIN, FOOTER_Y, PAGE_W - MARGIN, COLORS.border, 0.5)

      doc.font('Helvetica-Bold').fontSize(7).fillColor(COLORS.dark)
        .text('Terms & Conditions:', MARGIN, FOOTER_Y + 10)

      const terms = [
        'This is a computer-generated invoice and does not require a signature.',
        'Refunds are processed as per MEDLI cancellation policy.',
        'For queries, contact support@medli.in',
      ]

      doc.font('Helvetica').fontSize(6.5).fillColor(COLORS.light)
      terms.forEach((t, i) => {
        doc.text(`${i + 1}. ${t}`, MARGIN, FOOTER_Y + 22 + i * 10, { width: CONTENT })
      })

      // Bottom bar
      const BAR_Y = 808
      drawRect(doc, 0, BAR_Y, PAGE_W, 34, COLORS.primary)
      doc.font('Helvetica').fontSize(7).fillColor('#93c5fd')
        .text(
          'MEDLI Healthcare Pvt. Ltd.  |  support@medli.in  |  www.medli.in',
          MARGIN,
          BAR_Y + 12,
          { width: CONTENT, align: 'center' }
        )

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}