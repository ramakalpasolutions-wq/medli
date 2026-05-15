import nodemailer from 'nodemailer'

let transporter = null

function getTransporter() {
  if (transporter) return transporter

  const port   = Number(process.env.SMTP_PORT || 587)
  const secure = port === 465                       // ✅ Auto: 465=SSL, 587=TLS

  transporter = nodemailer.createTransport({
    host:    process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // ✅ Connection pooling prevents "socket close" errors
    pool:               true,
    maxConnections:     3,
    maxMessages:        100,
    connectionTimeout:  10_000,    // 10s
    greetingTimeout:    10_000,
    socketTimeout:      15_000,
    tls: {
      rejectUnauthorized: false,
      minVersion:         'TLSv1.2',
    },
  })

  return transporter
}

export async function verifyEmailConfig() {
  try {
    const t = getTransporter()
    await t.verify()
    console.log('[SMTP] connection verified ✓')
    return true
  } catch (error) {
    console.error('[SMTP] verification failed:', error?.message)
    return false
  }
}

export async function sendEmail({ to, subject, html, text, attachments = [] }) {
  try {
    const t = getTransporter()

    const info = await t.sendMail({
      from:    process.env.SMTP_FROM || `MEDLI <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
      attachments,
    })

    console.log('[SMTP] email sent →', to, '| messageId:', info.messageId)
    return info
  } catch (error) {
    console.error('[SMTP] sendEmail failed:', error?.message)
    throw error
  }
}

export async function sendEmailWithPDF({ to, subject, html, pdfBuffer, filename }) {
  return sendEmail({
    to,
    subject,
    html,
    attachments: [
      {
        filename:    filename || 'invoice.pdf',
        content:     pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  })
}

export default { sendEmail, sendEmailWithPDF, verifyEmailConfig }