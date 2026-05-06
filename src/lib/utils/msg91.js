import axios from 'axios'

export async function sendSMS({ phone, templateId, variables }) {
  const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`

  const payload = {
    template_id: templateId || process.env.MSG91_TEMPLATE_ID_OTP,
    short_url: '0',
    mobiles: formattedPhone,
    ...variables,
  }

  const response = await axios.post(
    'https://api.msg91.com/api/v5/flow/',
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        authkey: process.env.MSG91_AUTH_KEY,
      },
      timeout: 10000,
    }
  )

  return response.data
}