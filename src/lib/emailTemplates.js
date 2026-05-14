export function bookingConfirmedTemplate({
  patientName,
  bookingId,
  bookingType,
  hospitalName,
  doctorName,
  startTime,
  totalAmount,
  bookingUrl,
}) {
  return {
    subject: `Booking Confirmed - ${bookingId}`,
    text: `
Hello ${patientName},

Your booking has been confirmed successfully.

Booking ID: ${bookingId}
Booking Type: ${bookingType}
Hospital: ${hospitalName || '-'}
Doctor: ${doctorName || '-'}
Date & Time: ${startTime || '-'}
Amount Paid: ₹${totalAmount}

View Booking: ${bookingUrl || 'Login to your MEDLI account'}

Thanks,
MEDLI
    `.trim(),
    html: `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9;margin:0;padding:0;width:100%;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#10b981,#059669);padding:28px 24px;text-align:center;">
                <div style="font-size:14px;line-height:20px;font-weight:bold;letter-spacing:1px;color:#d1fae5;text-transform:uppercase;">
                  MEDLI
                </div>
                <h1 style="margin:10px 0 0 0;font-size:28px;line-height:34px;color:#ffffff;">
                  Booking Confirmed
                </h1>
                <p style="margin:10px 0 0 0;font-size:15px;line-height:22px;color:#ecfdf5;">
                  Your appointment has been booked successfully.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:24px;">
                <p style="margin:0 0 16px 0;font-size:16px;line-height:24px;color:#0f172a;">
                  Hello ${patientName},
                </p>

                <p style="margin:0 0 20px 0;font-size:15px;line-height:24px;color:#334155;">
                  Your booking has been confirmed successfully. Please keep these details for future reference.
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                  <tr>
                    <td style="padding:18px 18px 8px 18px;">
                      <p style="margin:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;"><strong style="color:#0f172a;">Booking ID:</strong> ${bookingId}</p>
                      <p style="margin:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;"><strong style="color:#0f172a;">Booking Type:</strong> ${bookingType}</p>
                      <p style="margin:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;"><strong style="color:#0f172a;">Hospital:</strong> ${hospitalName || '-'}</p>
                      <p style="margin:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;"><strong style="color:#0f172a;">Doctor:</strong> ${doctorName || '-'}</p>
                      <p style="margin:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;"><strong style="color:#0f172a;">Date & Time:</strong> ${startTime || '-'}</p>
                      <p style="margin:0 0 4px 0;font-size:15px;line-height:22px;color:#059669;"><strong>Amount Paid:</strong> ₹${totalAmount}</p>
                    </td>
                  </tr>
                </table>

                ${
                  bookingUrl
                    ? `
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;">
                  <tr>
                    <td align="center" bgcolor="#10b981" style="border-radius:10px;">
                      <a href="${bookingUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 24px;font-size:15px;line-height:20px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:10px;">
                        View Booking
                      </a>
                    </td>
                  </tr>
                </table>
                `
                    : ''
                }

                <p style="margin:24px 0 0 0;font-size:14px;line-height:22px;color:#64748b;">
                  Need this later? Keep this email saved for quick access to your booking details.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 24px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:13px;line-height:20px;color:#64748b;text-align:center;">
                  Thanks,<br />
                  <strong style="color:#0f172a;">MEDLI</strong>
                </p>
              </td>
            </tr>
          </table>

          <p style="margin:14px 0 0 0;font-size:12px;line-height:18px;color:#94a3b8;text-align:center;">
            This is a transactional email regarding your booking.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
    `,
  }
}