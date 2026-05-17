// C:\Users\ASUS\medli2\src\lib\emailTemplates.js
// (Keep your existing bookingConfirmedTemplate function above)

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
                  🎥 Your Video Consultation
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
                        🎥 Join Video Consultation
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Meet link box (copy-friendly) -->
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