import nodemailer from 'nodemailer'

let transporter = null

function getTransporter() {
  if (transporter) return transporter

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  return transporter
}

export async function sendEmail({ to, subject, html, text, attachments = [] }) {
  const t = getTransporter()

  const info = await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text,
    attachments,
  })

  console.log('[Email] Sent:', info.messageId)
  console.log('[Email] Accepted:', info.accepted)
  console.log('[Email] Rejected:', info.rejected)

  return info
}

export async function verifyEmailTransport() {
  const t = getTransporter()
  return t.verify()
}