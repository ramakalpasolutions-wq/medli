import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { sendEmail } from '@/lib/utils/nodemailer'
import { getSettlementCsv } from '../route'

export async function POST(request) {
  try {
    const user = await verifyAuth(request)

    if (user.role !== 'super_admin') {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { status = 'completed', from, to } = body || {}

    if (!from || !to) {
      return Response.json(
        { success: false, error: 'From and To dates are required' },
        { status: 400 }
      )
    }

    const csv = await getSettlementCsv({ status, from, to })
    const toEmail = user.email || process.env.ADMIN_EMAIL

    if (!toEmail) {
      return Response.json(
        { success: false, error: 'Admin email is not configured' },
        { status: 400 }
      )
    }

    await sendEmail({
      to: toEmail,
      subject: `Settlement CSV Export (${status}) ${from} to ${to}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Settlement CSV Export</h2>
          <p>Please find the attached settlement export.</p>
          <p><strong>Status:</strong> ${status}</p>
          <p><strong>Date Range:</strong> ${from} to ${to}</p>
        </div>
      `,
      attachments: [
        {
          filename: `settlements-${status}-${from}-to-${to}.csv`,
          content: csv,
          contentType: 'text/csv',
        },
      ],
    })

    return Response.json({
      success: true,
      message: 'Settlement CSV emailed successfully',
    })
  } catch (err) {
    console.error('[Mail Settlements CSV]', err.message)
    return Response.json(
      { success: false, error: err.message || 'Failed to send settlement email' },
      { status: 500 }
    )
  }
}