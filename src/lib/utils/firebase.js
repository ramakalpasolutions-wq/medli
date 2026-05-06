import admin from 'firebase-admin'

let firebaseApp = null

function getFirebaseApp() {
  if (firebaseApp) return firebaseApp

  if (admin.apps.length > 0) {
    firebaseApp = admin.apps[0]
    return firebaseApp
  }

  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT || '{}'
    const serviceAccount = typeof raw === 'string' ? JSON.parse(raw) : raw

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
  } catch (err) {
    console.error('[Firebase] Init failed:', err.message)
    throw new Error('Firebase initialization failed')
  }

  return firebaseApp
}

export async function sendPushToTokens({ tokens, title, body, data }) {
  if (!tokens || tokens.length === 0) return

  const app = getFirebaseApp()
  const messaging = admin.messaging(app)

  const messages = tokens.map((token) => ({
    token,
    notification: { title, body },
    data: data ? Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    ) : {},
    android: {
      priority: 'high',
      notification: { sound: 'default', clickAction: 'FLUTTER_NOTIFICATION_CLICK' },
    },
    apns: {
      payload: { aps: { sound: 'default', badge: 1 } },
    },
  }))

  // Send in batches of 500
  const results = []
  for (let i = 0; i < messages.length; i += 500) {
    const batch = messages.slice(i, i + 500)
    const response = await messaging.sendEach(batch)
    results.push(...response.responses)
  }

  return results
}

export async function sendPushToTopic({ topic, title, body, data }) {
  const app = getFirebaseApp()
  const messaging = admin.messaging(app)

  const message = {
    topic,
    notification: { title, body },
    data: data ? Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    ) : {},
    android: { priority: 'high' },
    apns: { payload: { aps: { sound: 'default' } } },
  }

  return messaging.send(message)
}