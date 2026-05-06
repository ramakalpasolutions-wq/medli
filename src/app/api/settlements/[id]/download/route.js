// src/app/api/settlements/[id]/download/route.js
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import PDFDocument from 'pdfkit'

export function OPTIONS() { return handleOptions() }

export async function GET(request, { params }) {
  try {
    const user = await verifyAuth(request)
    const { id } = await params

    const settlement = await prisma.settlement.findUnique({ where: { id } })
    if (!settlement) return errorResponse('Settlement not found', 'NOT_FOUND', 404)

    // Access control
    if (user.role === 'hospital_admin') {
      const hospital = await prisma.hospital.findFirst({ where: { adminUserId: user.id } })
      if (!hospital || hospital.id !== settlement.entityId)
        return errorResponse('Access denied', 'FORBIDDEN', 403)
    } else if (user.role === 'lab_admin') {
      const lab = await prisma.lab.findFirst({ where: { adminUserId: user.id } })
      if (!lab || lab.id !== settlement.entityId)
        return errorResponse('Access denied', 'FORBIDDEN', 403)
    } else if (!['super_admin', 'regional_manager'].includes(user.role)) {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    const pdfBuffer = await generateSettlementPDF(settlement)

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="MEDLI-Settlement-${settlement.settlementNumber}.pdf"`,
        'Content-Length':      pdfBuffer.length.toString(),
        'Cache-Control':       'no-store',
      },
    })
  } catch (err) {
    console.error('[Settlement Download]', err.message)
    if (err.message?.includes('token') || err.message?.includes('Unauthorized'))
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    return errorResponse('Failed to generate settlement PDF', 'SERVER_ERROR', 500)
  }
}

// ── PDF Generator ─────────────────────────────────────────────────────────────
function generateSettlementPDF(s) {
  return new Promise((resolve, reject) => {
    try {
      const doc    = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `Settlement ${s.settlementNumber}`, Author: 'MEDLI' } })
      const chunks = []
      doc.on('data', (c) => chunks.push(c))
      doc.on('end',  () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const W      = 595.28
      const M      = 48
      const C      = W - M * 2
      const round  = (n) => Math.round((n || 0) * 100) / 100
      const fmtRs  = (n) => `Rs. ${round(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      const fmtDt  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—'

      // ── Header bar ──────────────────────────────────────────────────────────
      doc.rect(0, 0, W, 100).fill('#1a56db')
      doc.rect(0, 0, W, 4).fill('#1e40af')

      doc.font('Helvetica-Bold').fontSize(22).fillColor('#ffffff')
        .text('MEDLI', M, 28, { width: C / 2 })
      doc.font('Helvetica').fontSize(8).fillColor('#bfdbfe')
        .text('Healthcare Platform', M, 52, { width: C / 2 })

      doc.font('Helvetica-Bold').fontSize(11).fillColor('#ffffff')
        .text('SETTLEMENT STATEMENT', W - M - 200, 28, { width: 200, align: 'right' })
      doc.font('Helvetica').fontSize(9).fillColor('#bfdbfe')
        .text(`#${s.settlementNumber}`, W - M - 200, 44, { width: 200, align: 'right' })
      doc.font('Helvetica').fontSize(8).fillColor('#93c5fd')
        .text(`Date: ${fmtDt(s.transferredAt || s.createdAt)}`, W - M - 200, 60, { width: 200, align: 'right' })

      let y = 120

      // ── Entity info card ────────────────────────────────────────────────────
      doc.rect(M, y, C, 70).fillColor('#f9fafb').fill()
      doc.rect(M, y, C, 70).strokeColor('#e5e7eb').lineWidth(0.5).stroke()

      doc.font('Helvetica-Bold').fontSize(7).fillColor('#6b7280')
        .text('SETTLED TO', M + 14, y + 12)
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827')
        .text(s.entityName || '—', M + 14, y + 24)
      doc.font('Helvetica').fontSize(8).fillColor('#6b7280')
        .text(`Entity Type: ${(s.entityType || '').toUpperCase()}`, M + 14, y + 40)
      if (s.beneficiaryName) {
        doc.text(`Account: ${s.beneficiaryName}  |  IFSC: ${s.beneficiaryIFSC || '—'}`, M + 14, y + 52)
      }

      // Status badge
      const statusColor = s.status === 'completed' ? '#059669' : s.status === 'failed' ? '#dc2626' : '#d97706'
      doc.roundedRect(W - M - 80, y + 20, 70, 22, 4).fillColor(statusColor + '20').fill()
      doc.font('Helvetica-Bold').fontSize(8).fillColor(statusColor)
        .text(s.status.toUpperCase(), W - M - 80, y + 28, { width: 70, align: 'center' })

      y += 90

      // ── Period ──────────────────────────────────────────────────────────────
      if (s.periodFrom || s.periodTo) {
        doc.rect(M, y, C, 28).fillColor('#eff6ff').fill()
        doc.font('Helvetica').fontSize(8).fillColor('#1d4ed8')
          .text(`Settlement Period: ${fmtDt(s.periodFrom)} — ${fmtDt(s.periodTo)}`, M + 14, y + 10, { width: C - 28 })
        y += 40
      }

      // ── Breakdown table ─────────────────────────────────────────────────────
      const ROW_H = 28

      // Table header
      doc.rect(M, y, C, ROW_H).fillColor('#1a56db').fill()
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff')
      doc.text('DESCRIPTION',         M + 12,         y + 10, { width: C * 0.55 })
      doc.text('AMOUNT',              M + C * 0.55,   y + 10, { width: C * 0.45 - 12, align: 'right' })
      y += ROW_H

      const rows = [
        { label: `Consultation / Test Revenue (${s.totalBookings || 0} bookings)`, value: s.grossAmount,         positive: true  },
        ...(s.refundsDeducted > 0
          ? [{ label: 'Refunds Deducted (cancelled bookings)', value: s.refundsDeducted, positive: false }]
          : []),
      ]

      rows.forEach((row, i) => {
        if (i % 2 === 0) doc.rect(M, y, C, ROW_H).fillColor('#f9fafb').fill()
        doc.font('Helvetica').fontSize(9).fillColor('#374151')
          .text(row.label, M + 12, y + 9, { width: C * 0.55 - 12 })
        doc.font('Helvetica-Bold').fontSize(9)
          .fillColor(row.positive ? '#111827' : '#dc2626')
          .text(
            row.positive ? fmtRs(row.value) : `- ${fmtRs(row.value)}`,
            M + C * 0.55, y + 9, { width: C * 0.45 - 12, align: 'right' }
          )
        y += ROW_H
      })

      doc.rect(M, y, C, 0.5).fillColor('#e5e7eb').fill()
      y += 8

      // ── Total row ───────────────────────────────────────────────────────────
      doc.roundedRect(M + C * 0.4, y, C * 0.6, 34, 4).fillColor('#1a56db').fill()
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff')
        .text('AMOUNT TRANSFERRED', M + C * 0.4 + 12, y + 8, { width: C * 0.3 })
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#ffffff')
        .text(fmtRs(s.netSettlementAmount), M + C * 0.4 + 12, y + 8, { width: C * 0.6 - 24, align: 'right' })
      y += 50

      // ── Transfer details ────────────────────────────────────────────────────
      if (s.utrNumber || s.hdfcTransactionId || s.transferMode) {
        doc.rect(M, y, C, 36).fillColor('#f0fdf4').fill()
        doc.rect(M, y, C, 36).strokeColor('#bbf7d0').lineWidth(0.5).stroke()

        doc.font('Helvetica-Bold').fontSize(7).fillColor('#15803d')
          .text('TRANSFER DETAILS', M + 12, y + 8)
        doc.font('Helvetica').fontSize(8).fillColor('#374151')

        const details = []
        if (s.utrNumber)         details.push(`UTR: ${s.utrNumber}`)
        if (s.hdfcTransactionId) details.push(`Txn: ${s.hdfcTransactionId}`)
        if (s.transferMode)      details.push(`Mode: ${s.transferMode}`)
        if (s.transferredAt)     details.push(`Transferred: ${fmtDt(s.transferredAt)}`)

        doc.text(details.join('  |  '), M + 12, y + 20, { width: C - 24 })
        y += 50
      }

      // ── Notes ───────────────────────────────────────────────────────────────
      if (s.notes) {
        doc.rect(M, y, C, 36).fillColor('#fafafa').fill()
        doc.font('Helvetica-Bold').fontSize(7).fillColor('#6b7280').text('NOTES', M + 12, y + 8)
        doc.font('Helvetica').fontSize(8).fillColor('#374151').text(s.notes, M + 12, y + 20, { width: C - 24 })
        y += 50
      }

      // ── Footer ──────────────────────────────────────────────────────────────
      const FOOTER_Y = 780
      doc.rect(M, FOOTER_Y, C, 0.5).fillColor('#e5e7eb').fill()
      doc.font('Helvetica').fontSize(7).fillColor('#9ca3af')
        .text('This is a computer-generated settlement statement. For queries contact support@medli.in', M, FOOTER_Y + 10, { width: C })

      doc.rect(0, 808, W, 34).fillColor('#1a56db').fill()
      doc.font('Helvetica').fontSize(7).fillColor('#93c5fd')
        .text('MEDLI Healthcare  |  support@medli.in  |  www.medli.in', M, 820, { width: C, align: 'center' })

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}