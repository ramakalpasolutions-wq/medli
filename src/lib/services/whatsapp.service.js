// src/lib/services/whatsapp.service.js

function normalizeIndianMobile(value) {
  if (!value) return null

  let digits =
    String(value)
      .replace(/\D/g, '')

  if (!digits) return null

  // +91XXXXXXXXXX
  if (
    digits.length === 12 &&
    digits.startsWith('91')
  ) {
    return digits
  }

  // 0XXXXXXXXXX
  if (
    digits.length === 11 &&
    digits.startsWith('0')
  ) {
    digits =
      digits.substring(1)
  }

  // XXXXXXXXXX
  if (digits.length === 10) {
    return `91${digits}`
  }

  return digits
}

export function formatBookingDate(
  value
) {
  if (!value) return ''

  try {
    return new Intl.DateTimeFormat(
      'en-IN',
      {
        timeZone:
          'Asia/Kolkata',

        day:
          '2-digit',

        month:
          'short',

        year:
          'numeric',
      }
    ).format(
      new Date(value)
    )
  } catch {
    return ''
  }
}

export function formatBookingTime(
  value
) {
  if (!value) return ''

  try {
    return new Intl.DateTimeFormat(
      'en-IN',
      {
        timeZone:
          'Asia/Kolkata',

        hour:
          '2-digit',

        minute:
          '2-digit',

        hour12:
          true,
      }
    ).format(
      new Date(value)
    )
  } catch {
    return ''
  }
}

/**
 * Sends an approved WhatsApp template.
 *
 * IMPORTANT:
 * MSG91 WhatsApp template payloads depend on the
 * template/configuration in your MSG91 account.
 *
 * The queue/worker architecture does not depend on
 * that payload shape.
 */
export async function sendWhatsappTemplate({
  mobile,
  templateId,
  variables = {},
}) {
  const authKey =
    process.env.MSG91_AUTH_KEY

  const integratedNumber =
    process.env
      .MSG91_WHATSAPP_INTEGRATED_NUMBER

  const recipient =
    normalizeIndianMobile(
      mobile
    )

  if (!authKey) {
    throw new Error(
      'MSG91_AUTH_KEY is not configured'
    )
  }

  if (!integratedNumber) {
    throw new Error(
      'MSG91_WHATSAPP_INTEGRATED_NUMBER is not configured'
    )
  }

  if (!templateId) {
    throw new Error(
      'WhatsApp template ID is not configured'
    )
  }

  if (!recipient) {
    throw new Error(
      'Invalid WhatsApp mobile number'
    )
  }

  /*
   * =========================================================
   * MSG91 REQUEST
   * =========================================================
   *
   * Put the exact endpoint and payload required by your
   * approved MSG91 WhatsApp template here.
   *
   * Do NOT use the SMS API for WhatsApp.
   *
   * Once you give me your current MSG91 WhatsApp template
   * configuration/API sample, this block can be filled in
   * exactly.
   */

  const endpoint =
    process.env
      .MSG91_WHATSAPP_API_URL

  if (!endpoint) {
    throw new Error(
      'MSG91_WHATSAPP_API_URL is not configured'
    )
  }

  const payload = {
    integrated_number:
      integratedNumber,

    recipient,

    template_id:
      templateId,

    variables,
  }

  const response =
    await fetch(
      endpoint,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          authkey:
            authKey,
        },

        body:
          JSON.stringify(
            payload
          ),

        cache:
          'no-store',
      }
    )

  let data = null

  try {
    data =
      await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    console.error(
      '[WhatsApp] MSG91 error:',
      {
        status:
          response.status,

        response:
          data,
      }
    )

    throw new Error(
      data?.message ||
      data?.error ||
      `WhatsApp request failed (${response.status})`
    )
  }

  console.log(
    '[WhatsApp] Sent:',
    {
      mobile:
        maskMobile(
          recipient
        ),

      templateId,

      response:
        data,
    }
  )

  return data
}

function maskMobile(
  value
) {
  const text =
    String(value || '')

  if (text.length < 4) {
    return '****'
  }

  return `********${text.slice(-4)}`
}