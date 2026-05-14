import nodemailer from 'nodemailer'

let transporter = null

function getTransporter() {
  if (transporter) return transporter

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'apikey',
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })

  return transporter
}

export async function verifyEmailConfig() {
  try {
    const t = getTransporter()
    await t.verify()
    console.log('SMTP connection verified')
    return true
  } catch (error) {
    console.error('SMTP verification failed:', error)
    return false
  }
}

export async function sendEmail({ to, subject, html, text, attachments = [] }) {
  try {
    const t = getTransporter()

    const info = await t.sendMail({
      from: process.env.SMTP_FROM || 'noreply@medli.in',
      to,
      subject,
      html,
      text,
      attachments,
    })

    console.log('Email sent:', info.messageId)
    return info
  } catch (error) {
    console.error('sendEmail failed:', error)
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
        filename: filename || 'invoice.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  })
}