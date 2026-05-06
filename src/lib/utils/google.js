import { google } from 'googleapis'

export function getCalendarClient() {
  let serviceAccount

  try {
    const raw = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT || '{}'
    serviceAccount = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch (err) {
    throw new Error('Invalid GOOGLE_CALENDAR_SERVICE_ACCOUNT JSON: ' + err.message)
  }

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ],
  })

  return google.calendar({ version: 'v3', auth })
}