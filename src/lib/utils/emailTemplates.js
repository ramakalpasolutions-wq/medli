const base = (content) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>MEDLI</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:#1286f5;padding:28px 40px;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">MEDLI</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:12px;">Healthcare Platform</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">${content}</td></tr>
        <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;">
            © ${new Date().getFullYear()} MEDLI Healthcare Pvt. Ltd. | support@medli.in<br>
            This is an automated email. Please do not reply.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

const btn = (text, url) =>
  `<a href="${url}" style="display:inline-block;background:#1286f5;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;margin-top:20px;">${text}</a>`

const h2 = (t) => `<h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">${t}</h2>`
const p = (t) => `<p style="margin:0 0 12px;color:#4b5563;font-size:14px;line-height:1.6;">${t}</p>`

const infoRow = (label, value) => `
  <tr>
    <td style="padding:10px 0;color:#9ca3af;font-size:13px;width:40%;border-bottom:1px solid #f3f4f6;">${label}</td>
    <td style="padding:10px 0;color:#1a1a2e;font-size:13px;font-weight:600;border-bottom:1px solid #f3f4f6;">${value}</td>
  </tr>`

export function welcome({ name }) {
  return {
    subject: 'Welcome to MEDLI – Your Healthcare Platform',
    html: base(`
      ${h2(`Welcome, ${name}! 🎉`)}
      ${p('Your MEDLI account has been created successfully. You can now book hospital appointments, online consultations, and lab tests from the comfort of your home.')}
      ${p('We\'re committed to making healthcare accessible and convenient for everyone.')}
      ${btn('Get Started', `${process.env.NEXT_PUBLIC_APP_URL}`)}
    `),
  }
}

export function otp({ name, otp }) {
  return {
    subject: 'Your MEDLI OTP – Do Not Share',
    html: base(`
      ${h2('OTP Verification')}
      ${p(`Hi ${name || 'there'},`)}
      ${p('Your One-Time Password (OTP) for MEDLI is:')}
      <div style="text-align:center;margin:24px 0;">
        <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1286f5;background:#eef9ff;padding:16px 32px;border-radius:8px;">${otp}</span>
      </div>
      ${p('This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.')}
    `),
  }
}

export function bookingConfirmed({ name, bookingId, type, startTime, doctorName, labName, totalAmount }) {
  const typeLabel = type === 'lab' ? 'Lab Test Booking' : type === 'online' ? 'Online Consultation' : 'Hospital Appointment'
  return {
    subject: `Booking Confirmed – ${bookingId}`,
    html: base(`
      ${h2('Booking Confirmed ✅')}
      ${p(`Hi ${name}, your ${typeLabel} has been confirmed.`)}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        ${infoRow('Booking ID', bookingId)}
        ${infoRow('Type', typeLabel)}
        ${doctorName ? infoRow('Doctor', doctorName) : ''}
        ${labName ? infoRow('Lab', labName) : ''}
        ${infoRow('Date & Time', new Date(startTime).toLocaleString('en-IN'))}
        ${infoRow('Amount Paid', `₹${totalAmount}`)}
      </table>
      ${btn('View Booking', `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${bookingId}`)}
    `),
  }
}

export function bookingCancelled({ name, bookingId, refundAmount, refundPercent }) {
  return {
    subject: `Booking Cancelled – ${bookingId}`,
    html: base(`
      ${h2('Booking Cancelled')}
      ${p(`Hi ${name}, your booking <strong>${bookingId}</strong> has been cancelled.`)}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        ${infoRow('Booking ID', bookingId)}
        ${infoRow('Refund', refundAmount > 0 ? `₹${refundAmount} (${refundPercent}%)` : 'No refund applicable')}
        ${refundAmount > 0 ? infoRow('Refund Timeline', '5-7 business days') : ''}
      </table>
      ${p('If you have questions, please contact support@medli.in')}
    `),
  }
}

export function bookingRescheduled({ name, bookingId, newStartTime }) {
  return {
    subject: `Booking Rescheduled – ${bookingId}`,
    html: base(`
      ${h2('Booking Rescheduled 📅')}
      ${p(`Hi ${name}, your booking <strong>${bookingId}</strong> has been rescheduled.`)}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        ${infoRow('Booking ID', bookingId)}
        ${infoRow('New Date & Time', new Date(newStartTime).toLocaleString('en-IN'))}
      </table>
      ${btn('View Booking', `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${bookingId}`)}
    `),
  }
}

export function refundProcessed({ name, refundNumber, refundAmount, bookingId }) {
  return {
    subject: `Refund Processed – ₹${refundAmount}`,
    html: base(`
      ${h2('Refund Processed 💳')}
      ${p(`Hi ${name}, your refund has been processed.`)}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        ${infoRow('Refund ID', refundNumber)}
        ${infoRow('Booking ID', bookingId)}
        ${infoRow('Refund Amount', `₹${refundAmount}`)}
        ${infoRow('Timeline', '3-5 business days')}
      </table>
      ${p('The amount will be credited to your original payment method or registered bank account.')}
    `),
  }
}

export function settlementDone({ entityName, settlementNumber, amount, utrNumber }) {
  return {
    subject: `Settlement Completed – ${settlementNumber}`,
    html: base(`
      ${h2('Settlement Completed 🏦')}
      ${p(`Dear ${entityName}, your settlement has been processed.`)}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        ${infoRow('Settlement No.', settlementNumber)}
        ${infoRow('Amount', `₹${amount}`)}
        ${utrNumber ? infoRow('UTR Number', utrNumber) : ''}
        ${infoRow('Status', 'Completed')}
      </table>
      ${p('The amount has been transferred to your registered bank account.')}
    `),
  }
}

export function labReportReady({ name, bookingId, labName }) {
  return {
    subject: 'Your Lab Report is Ready',
    html: base(`
      ${h2('Lab Report Ready 🧪')}
      ${p(`Hi ${name}, your lab report from <strong>${labName}</strong> is ready.`)}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        ${infoRow('Booking ID', bookingId)}
        ${infoRow('Lab', labName)}
        ${infoRow('Status', 'Report Ready')}
      </table>
      ${btn('Download Report', `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${bookingId}/report`)}
    `),
  }
}