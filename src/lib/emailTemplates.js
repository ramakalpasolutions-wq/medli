// C:\Users\ASUS\medli2\src\lib\emailTemplates.js
export function supportTicketAdminTemplate({
  ticketId,
  name,
  email,
  phone,
  role,
  subject,
  category,
  message,
  createdAt,
}) {
  return {
    subject: `New Support Ticket - ${subject}`,
    text: `
A new support ticket was submitted.

Ticket ID: ${ticketId}
Name: ${name || 'N/A'}
Email: ${email || 'N/A'}
Phone: ${phone || 'N/A'}
Role: ${role || 'N/A'}
Category: ${category || 'other'}
Subject: ${subject}
Created At: ${createdAt}

Message:
${message}
    `.trim(),
    html: `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#0f172a,#334155);padding:28px 24px;text-align:center;">
                <h1 style="margin:0;font-size:24px;line-height:30px;color:#ffffff;">New Support Ticket</h1>
                <p style="margin:8px 0 0 0;font-size:14px;line-height:22px;color:#cbd5e1;">A user submitted a new request</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <p style="margin:0 0 8px 0;font-size:14px;color:#334155;"><strong style="color:#0f172a;">Ticket ID:</strong> ${ticketId}</p>
                      <p style="margin:0 0 8px 0;font-size:14px;color:#334155;"><strong style="color:#0f172a;">Name:</strong> ${name || 'N/A'}</p>
                      <p style="margin:0 0 8px 0;font-size:14px;color:#334155;"><strong style="color:#0f172a;">Email:</strong> ${email || 'N/A'}</p>
                      <p style="margin:0 0 8px 0;font-size:14px;color:#334155;"><strong style="color:#0f172a;">Phone:</strong> ${phone || 'N/A'}</p>
                      <p style="margin:0 0 8px 0;font-size:14px;color:#334155;"><strong style="color:#0f172a;">Role:</strong> ${role || 'N/A'}</p>
                      <p style="margin:0 0 8px 0;font-size:14px;color:#334155;"><strong style="color:#0f172a;">Category:</strong> ${category || 'other'}</p>
                      <p style="margin:0 0 8px 0;font-size:14px;color:#334155;"><strong style="color:#0f172a;">Subject:</strong> ${subject}</p>
                      <p style="margin:0;font-size:14px;color:#334155;"><strong style="color:#0f172a;">Created At:</strong> ${createdAt}</p>
                    </td>
                  </tr>
                </table>

                <div style="margin-top:18px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 18px;">
                  <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#9a3412;">User Message</p>
                  <p style="margin:0;font-size:14px;line-height:22px;color:#7c2d12;white-space:pre-wrap;">${message}</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `,
  }
}

export function supportTicketUserTemplate({
  name,
  ticketId,
  subject,
  category,
  status,
}) {
  return {
    subject: `Support Request Received - ${subject}`,
    text: `
Hello ${name || 'User'},

We received your support request successfully.

Ticket ID: ${ticketId}
Category: ${category || 'other'}
Subject: ${subject}
Status: ${status || 'new'}

Our support team will review it shortly.

Thanks,
MEDLI Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:30px 24px;text-align:center;">
                <h1 style="margin:0;font-size:24px;line-height:30px;color:#ffffff;">Support Request Received</h1>
                <p style="margin:8px 0 0 0;font-size:14px;line-height:22px;color:#e0e7ff;">Our team will review your request shortly</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0 0 14px 0;font-size:15px;line-height:24px;color:#334155;">Hello ${name || 'User'},</p>
                <p style="margin:0 0 18px 0;font-size:15px;line-height:24px;color:#334155;">
                  We received your support request successfully. Our support team will review it and get back to you if needed.
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <p style="margin:0 0 8px 0;font-size:14px;color:#334155;"><strong style="color:#0f172a;">Ticket ID:</strong> ${ticketId}</p>
                      <p style="margin:0 0 8px 0;font-size:14px;color:#334155;"><strong style="color:#0f172a;">Category:</strong> ${category || 'other'}</p>
                      <p style="margin:0 0 8px 0;font-size:14px;color:#334155;"><strong style="color:#0f172a;">Subject:</strong> ${subject}</p>
                      <p style="margin:0;font-size:14px;color:#334155;"><strong style="color:#0f172a;">Status:</strong> ${status || 'new'}</p>
                    </td>
                  </tr>
                </table>

                <p style="margin:18px 0 0 0;font-size:14px;line-height:22px;color:#64748b;">
                  Thank you,<br />
                  <strong style="color:#0f172a;">MEDLI Support Team</strong>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `,
  }
}

export function supportTicketStatusTemplate({
  name,
  ticketId,
  subject,
  status,
  adminNotes,
}) {
  return {
    subject: `Support Ticket Update - ${subject}`,
    text: `
Hello ${name || 'User'},

Your support ticket has been updated.

Ticket ID: ${ticketId}
Subject: ${subject}
Status: ${status}

${adminNotes ? `Admin Notes: ${adminNotes}` : ''}

Thanks,
MEDLI Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#10b981,#059669);padding:30px 24px;text-align:center;">
                <h1 style="margin:0;font-size:24px;line-height:30px;color:#ffffff;">Support Ticket Updated</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0 0 14px 0;font-size:15px;line-height:24px;color:#334155;">Hello ${name || 'User'},</p>
                <p style="margin:0 0 18px 0;font-size:15px;line-height:24px;color:#334155;">
                  Your support ticket status has been updated.
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <p style="margin:0 0 8px 0;font-size:14px;color:#334155;"><strong style="color:#0f172a;">Ticket ID:</strong> ${ticketId}</p>
                      <p style="margin:0 0 8px 0;font-size:14px;color:#334155;"><strong style="color:#0f172a;">Subject:</strong> ${subject}</p>
                      <p style="margin:0;font-size:14px;color:#334155;"><strong style="color:#0f172a;">Status:</strong> ${status}</p>
                    </td>
                  </tr>
                </table>

                ${adminNotes ? `
                <div style="margin-top:18px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 18px;">
                  <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#1d4ed8;">Admin Notes</p>
                  <p style="margin:0;font-size:14px;line-height:22px;color:#1e3a8a;white-space:pre-wrap;">${adminNotes}</p>
                </div>
                ` : ''}

                <p style="margin:18px 0 0 0;font-size:14px;line-height:22px;color:#64748b;">
                  Thank you,<br />
                  <strong style="color:#0f172a;">MEDLI Support Team</strong>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `,
  }
}
/* ═══════════════════════════════════════════════════════════════════════
   ✅ BOOKING CONFIRMED TEMPLATE
   Used for: in-person hospital visits & lab test bookings
═══════════════════════════════════════════════════════════════════════ */
export function bookingConfirmedTemplate({
  patientName,
  bookingId,
  bookingType,      // 'hospital' | 'lab' | 'online'
  hospitalName,     // hospital OR lab name
  doctorName,       // '-' for lab bookings
  startTime,        // formatted date+time string
  totalAmount,
  bookingUrl,
}) {
  const isLab = bookingType === 'lab'

  const typeLabel  = isLab ? '🧪 Lab Test' : '🏥 Hospital Visit'
  const typeAccent = isLab
    ? { primary: '#10b981', secondary: '#059669', bgLight: '#ecfdf5', border: '#a7f3d0', textDark: '#065f46' }
    : { primary: '#6366f1', secondary: '#8b5cf6', bgLight: '#eef2ff', border: '#c7d2fe', textDark: '#3730a3' }

  return {
    subject: `✅ Booking Confirmed - ${bookingId}`,
    text: `
Hello ${patientName},

Your ${isLab ? 'lab test' : 'appointment'} has been confirmed!

Booking ID: ${bookingId}
${isLab ? 'Lab' : 'Hospital'}: ${hospitalName}
${!isLab ? `Doctor: Dr. ${doctorName}` : ''}
Date & Time: ${startTime}
Amount Paid: ₹${totalAmount}

IMPORTANT:
${isLab
  ? `- Arrive 10 minutes early for sample collection
- Carry a valid ID proof
- Follow any fasting/preparation instructions given`
  : `- Arrive 15 minutes early for registration
- Carry a valid ID proof
- Bring your medical history & previous reports`}

View Booking: ${bookingUrl}

Thanks,
MEDLI Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9;margin:0;padding:0;width:100%;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;">

            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,${typeAccent.primary},${typeAccent.secondary});padding:32px 24px;text-align:center;">
                <div style="font-size:14px;line-height:20px;font-weight:bold;letter-spacing:1px;color:#ffffff;opacity:0.9;text-transform:uppercase;">
                  MEDLI · ${typeLabel}
                </div>
                <h1 style="margin:12px 0 0 0;font-size:28px;line-height:34px;color:#ffffff;">
                  ✅ Booking Confirmed
                </h1>
                <p style="margin:10px 0 0 0;font-size:15px;line-height:22px;color:#ffffff;opacity:0.9;">
                  Your appointment is all set
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:28px 24px;">
                <p style="margin:0 0 16px 0;font-size:16px;line-height:24px;color:#0f172a;">
                  Hello ${patientName},
                </p>
                <p style="margin:0 0 20px 0;font-size:15px;line-height:24px;color:#334155;">
                  ${isLab
                    ? `Your lab test booking at <strong>${hospitalName}</strong> has been confirmed. Please arrive on time for your sample collection.`
                    : `Your appointment with <strong>Dr. ${doctorName}</strong> at <strong>${hospitalName}</strong> has been confirmed.`}
                </p>

                <!-- Booking details card -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin:20px 0;">
                  <tr>
                    <td style="padding:18px;">
                      <p style="margin:0 0 12px 0;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">
                        Booking Details
                      </p>
                      <p style="margin:0 0 10px 0;font-size:14px;line-height:20px;color:#334155;">
                        <strong style="color:#0f172a;">Booking ID:</strong>
                        <span style="font-family:monospace;color:${typeAccent.primary};font-weight:600;"> ${bookingId}</span>
                      </p>
                      <p style="margin:0 0 10px 0;font-size:14px;line-height:20px;color:#334155;">
                        <strong style="color:#0f172a;">${isLab ? 'Lab' : 'Hospital'}:</strong> ${hospitalName}
                      </p>
                      ${!isLab ? `
                      <p style="margin:0 0 10px 0;font-size:14px;line-height:20px;color:#334155;">
                        <strong style="color:#0f172a;">Doctor:</strong> Dr. ${doctorName}
                      </p>
                      ` : ''}
                      <p style="margin:0 0 10px 0;font-size:14px;line-height:20px;color:#334155;">
                        <strong style="color:#0f172a;">Date & Time:</strong> ${startTime}
                      </p>
                      <p style="margin:0;font-size:15px;line-height:22px;color:${typeAccent.primary};">
                        <strong>Amount Paid:</strong> ₹${totalAmount}
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- View Booking Button -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px auto;">
                  <tr>
                    <td align="center" style="background:linear-gradient(135deg,${typeAccent.primary},${typeAccent.secondary});border-radius:12px;box-shadow:0 8px 20px ${typeAccent.primary}40;">
                      <a href="${bookingUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 32px;font-size:15px;line-height:20px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:12px;">
                        📋 View Booking Details
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Important instructions -->
                <div style="background:${typeAccent.bgLight};border:1px solid ${typeAccent.border};border-radius:12px;padding:16px 18px;margin:20px 0;">
                  <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:${typeAccent.textDark};">
                    📌 Please Note:
                  </p>
                  <ul style="margin:0;padding:0 0 0 20px;color:${typeAccent.textDark};font-size:13px;line-height:1.8;">
                    ${isLab
                      ? `<li>Arrive <strong>10 minutes early</strong> for sample collection</li>
                         <li>Carry a <strong>valid government ID</strong></li>
                         <li>Follow any <strong>fasting/preparation</strong> instructions</li>
                         <li>Report will be available within the lab's TAT</li>`
                      : `<li>Arrive <strong>15 minutes early</strong> for registration</li>
                         <li>Carry a <strong>valid government ID</strong></li>
                         <li>Bring your <strong>medical history & previous reports</strong></li>
                         <li>Contact hospital reception for any queries</li>`}
                  </ul>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 24px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0 0 6px 0;font-size:13px;line-height:20px;color:#64748b;text-align:center;">
                  Need help? Contact us at <a href="mailto:support@medli.in" style="color:${typeAccent.primary};text-decoration:none;font-weight:600;">support@medli.in</a>
                </p>
                <p style="margin:0;font-size:13px;line-height:20px;color:#64748b;text-align:center;">
                  Thanks,<br />
                  <strong style="color:#0f172a;">MEDLI Team</strong>
                </p>
              </td>
            </tr>
          </table>

          <p style="margin:14px 0 0 0;font-size:12px;line-height:18px;color:#94a3b8;text-align:center;">
            This is a transactional email regarding your booking confirmation.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
    `,
  }
}


/* ═══════════════════════════════════════════════════════════════════════
   ✅ MEET LINK TEMPLATE (unchanged — your existing one)
   Used for: online video consultations
═══════════════════════════════════════════════════════════════════════ */
export function meetLinkTemplate({
  patientName,
  bookingId,
  doctorName,
  hospitalName,
  startTime,
  meetLink,
  totalAmount,
  bookingUrl,
}) {
  return {
    subject: `🎥 Online Consultation Confirmed - ${bookingId}`,
    text: `
Hello ${patientName},

Your online consultation with Dr. ${doctorName} has been confirmed.

Booking ID: ${bookingId}
Doctor: Dr. ${doctorName}
Hospital: ${hospitalName || '-'}
Date & Time: ${startTime}
Amount Paid: ₹${totalAmount}

🎥 JOIN MEETING:
${meetLink}

IMPORTANT:
- Join 5 minutes before your scheduled time
- Test your camera & microphone in advance
- Have a stable internet connection
- Keep your medical history & reports ready

View Booking: ${bookingUrl}

Thanks,
MEDLI Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9;margin:0;padding:0;width:100%;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;">

            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#8b5cf6,#6366f1);padding:32px 24px;text-align:center;">
                <div style="font-size:14px;line-height:20px;font-weight:bold;letter-spacing:1px;color:#e0e7ff;text-transform:uppercase;">
                  MEDLI · Online Consultation
                </div>
                <h1 style="margin:12px 0 0 0;font-size:28px;line-height:34px;color:#ffffff;">
                  🎥 Your online  Consultation
                </h1>
                <p style="margin:10px 0 0 0;font-size:15px;line-height:22px;color:#e0e7ff;">
                  Meeting link generated successfully
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:28px 24px;">
                <p style="margin:0 0 16px 0;font-size:16px;line-height:24px;color:#0f172a;">
                  Hello ${patientName},
                </p>
                <p style="margin:0 0 20px 0;font-size:15px;line-height:24px;color:#334155;">
                  Your online consultation with <strong>Dr. ${doctorName}</strong> has been confirmed. Use the meeting link below to join at the scheduled time.
                </p>

                <!-- Join Meeting Button -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px auto;">
                  <tr>
                    <td align="center" style="background:linear-gradient(135deg,#8b5cf6,#6366f1);border-radius:12px;box-shadow:0 8px 20px rgba(99,102,241,0.4);">
                      <a href="${meetLink}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:18px 36px;font-size:17px;line-height:22px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:12px;">
                        🎥 Join online  Consultation
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Meet link box -->
                <div style="background:#f5f3ff;border:1.5px solid #ddd6fe;border-radius:12px;padding:14px 16px;margin:20px 0;">
                  <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;color:#6d28d9;text-transform:uppercase;letter-spacing:0.5px;">
                    Meeting Link
                  </p>
                  <p style="margin:0;font-size:13px;color:#4c1d95;font-family:monospace;word-break:break-all;">
                    <a href="${meetLink}" style="color:#6d28d9;text-decoration:none;">${meetLink}</a>
                  </p>
                </div>

                <!-- Booking details -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin:20px 0;">
                  <tr>
                    <td style="padding:18px;">
                      <p style="margin:0 0 12px 0;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">
                        Booking Details
                      </p>
                      <p style="margin:0 0 10px 0;font-size:14px;line-height:20px;color:#334155;"><strong style="color:#0f172a;">Booking ID:</strong> ${bookingId}</p>
                      <p style="margin:0 0 10px 0;font-size:14px;line-height:20px;color:#334155;"><strong style="color:#0f172a;">Doctor:</strong> Dr. ${doctorName}</p>
                      ${hospitalName ? `<p style="margin:0 0 10px 0;font-size:14px;line-height:20px;color:#334155;"><strong style="color:#0f172a;">Hospital:</strong> ${hospitalName}</p>` : ''}
                      <p style="margin:0 0 10px 0;font-size:14px;line-height:20px;color:#334155;"><strong style="color:#0f172a;">Date & Time:</strong> ${startTime}</p>
                      <p style="margin:0;font-size:15px;line-height:22px;color:#059669;"><strong>Amount Paid:</strong> ₹${totalAmount}</p>
                    </td>
                  </tr>
                </table>

                <!-- Important instructions -->
                <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 18px;margin:20px 0;">
                  <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#92400e;">
                    ⚠️ Before Your Consultation:
                  </p>
                  <ul style="margin:0;padding:0 0 0 20px;color:#78350f;font-size:13px;line-height:1.8;">
                    <li>Join <strong>5 minutes early</strong> to avoid delays</li>
                    <li>Test your <strong>camera & microphone</strong></li>
                    <li>Ensure stable <strong>internet connection</strong></li>
                    <li>Keep your <strong>medical history & reports</strong> ready</li>
                    <li>Find a <strong>quiet, well-lit</strong> space</li>
                  </ul>
                </div>

                ${
                  bookingUrl
                    ? `
                <!-- Secondary action -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:20px auto 0 auto;">
                  <tr>
                    <td align="center" style="border:1.5px solid #e2e8f0;border-radius:10px;">
                      <a href="${bookingUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:11px 22px;font-size:13px;line-height:18px;font-weight:600;color:#475569;text-decoration:none;border-radius:10px;">
                        📋 View Booking Details
                      </a>
                    </td>
                  </tr>
                </table>
                `
                    : ''
                }
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 24px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0 0 6px 0;font-size:13px;line-height:20px;color:#64748b;text-align:center;">
                  Need help? Contact us at <a href="mailto:support@medli.in" style="color:#6366f1;text-decoration:none;font-weight:600;">support@medli.in</a>
                </p>
                <p style="margin:0;font-size:13px;line-height:20px;color:#64748b;text-align:center;">
                  Thanks,<br />
                  <strong style="color:#0f172a;">MEDLI Team</strong>
                </p>
              </td>
            </tr>
          </table>

          <p style="margin:14px 0 0 0;font-size:12px;line-height:18px;color:#94a3b8;text-align:center;">
            This is a transactional email regarding your online consultation booking.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
    `,
  }
}