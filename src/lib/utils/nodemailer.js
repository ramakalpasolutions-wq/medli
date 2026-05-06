import nodemailer from 'nodemailer'

let transporter = null

function getTransporter() {
  if (transporter) return transporter

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'apikey',
      pass: process.env.SMTP_PASS,
    },
  })

  return transporter
}

export async function sendEmail({ to, subject, html, text, attachments }) {
  const t = getTransporter()

  const info = await t.sendMail({
    from: process.env.SMTP_FROM || 'noreply@medli.in',
    to,
    subject,
    html,
    text,
    attachments,
  })

  return info
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