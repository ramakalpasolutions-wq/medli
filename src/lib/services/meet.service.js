import { getCalendarClient } from '@/lib/utils/google'

export async function createConsultationEvent({
  bookingId,
  doctorEmail,
  patientEmail,
  patientName,
  doctorName,
  startTime,
  endTime,
  timezone,
}) {
  const calendar = getCalendarClient()

  const event = {
    summary: `MEDLI Consultation – ${doctorName} & ${patientName}`,
    description: `Online consultation booked via MEDLI.\nBooking ID: ${bookingId}`,
    start: {
      dateTime: new Date(startTime).toISOString(),
      timeZone: timezone || 'Asia/Kolkata',
    },
    end: {
      dateTime: new Date(endTime).toISOString(),
      timeZone: timezone || 'Asia/Kolkata',
    },
    attendees: [
      { email: doctorEmail, displayName: doctorName },
      { email: patientEmail, displayName: patientName },
    ],
    conferenceData: {
      createRequest: {
        requestId: `medli-${bookingId}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 15 },
      ],
    },
  }

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: 1,
    sendUpdates: 'all',
  })

  const meetLink =
    response.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ||
    response.data.hangoutLink ||
    null

  return {
    meetLink,
    calendarEventId: response.data.id,
  }
}

export async function updateConsultationEvent({
  calendarEventId,
  newStartTime,
  newEndTime,
  timezone,
}) {
  const calendar = getCalendarClient()

  const response = await calendar.events.patch({
    calendarId: 'primary',
    eventId: calendarEventId,
    resource: {
      start: {
        dateTime: new Date(newStartTime).toISOString(),
        timeZone: timezone || 'Asia/Kolkata',
      },
      end: {
        dateTime: new Date(newEndTime).toISOString(),
        timeZone: timezone || 'Asia/Kolkata',
      },
    },
    sendUpdates: 'all',
  })

  return response.data
}

export async function cancelConsultationEvent({ calendarEventId }) {
  const calendar = getCalendarClient()

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: calendarEventId,
    sendUpdates: 'all',
  })

  return { cancelled: true }
}