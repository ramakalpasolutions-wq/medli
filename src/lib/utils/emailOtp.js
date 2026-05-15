/**
 * Email OTP — uses cache (Redis in prod, memory in dev)
 *
 * IMPORTANT: All cache calls now use `await` because cache is async
 */

import cache         from '@/lib/cache'
import { sendEmail } from '@/lib/utils/nodemailer'

const OTP_EXPIRY_SEC = 5 * 60       // 5 minutes
const OTP_LENGTH     = 6
const MAX_RETRIES    = 5
const COOLDOWN_SEC   = 30           // seconds between sends

const BYPASS_MODE = () => process.env.EMAIL_OTP_BYPASS === 'true'

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function otpKey(email)      { return `otp:email:${normalizeEmail(email)}` }
function attemptKey(email)  { return `otp:email:attempts:${normalizeEmail(email)}` }
function cooldownKey(email) { return `otp:email:cooldown:${normalizeEmail(email)}` }

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function buildOtpHtml(otp, email) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background:#f8fafc;">
      <div style="background:#fff; border-radius:12px; padding:32px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <div style="text-align:center; margin-bottom:24px;">
          <h1 style="margin:0; color:#6366f1; font-size:28px; letter-spacing:-0.5px;">MEDLI</h1>
          <p style="color:#64748b; font-size:13px; margin:4px 0 0;">Healthcare made simple</p>
        </div>
        <h2 style="color:#0f172a; font-size:18px; margin:0 0 12px;">Your verification code</h2>
        <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 20px;">
          Use the OTP below to verify <strong>${email}</strong>. This code expires in 5 minutes.
        </p>
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; font-size:32px; font-weight:700; letter-spacing:8px; text-align:center; padding:18px; border-radius:10px; margin:0 0 20px;">
          ${otp}
        </div>
        <p style="color:#94a3b8; font-size:12px; margin:0; text-align:center;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
      <p style="color:#94a3b8; font-size:11px; text-align:center; margin-top:16px;">
        © ${new Date().getFullYear()} MEDLI. All rights reserved.
      </p>
    </div>
  `
}

export async function sendEmailOtp(email) {
  try {
    const normalized = normalizeEmail(email)
    if (!normalized) {
      return { success: false, error: 'Email is required' }
    }

    if (await cache.get(cooldownKey(normalized))) {
      return { success: false, error: 'Please wait before requesting another OTP' }
    }

    const attempts = Number((await cache.get(attemptKey(normalized))) ?? 0)
    if (attempts >= MAX_RETRIES) {
      return { success: false, error: 'Too many OTP requests. Try again in 5 minutes.' }
    }

    const otp = generateOtp()
    await cache.set(otpKey(normalized),      otp,                  OTP_EXPIRY_SEC)
    await cache.set(attemptKey(normalized),  String(attempts + 1), OTP_EXPIRY_SEC)
    await cache.set(cooldownKey(normalized), '1',                  COOLDOWN_SEC)

    console.log(`[EMAIL OTP] stored for ${normalized} (TTL: ${OTP_EXPIRY_SEC}s)`)

    if (BYPASS_MODE()) {
      console.log(`[EMAIL OTP BYPASS] ${normalized} → ${otp}`)
      return {
        success:    true,
        bypassMode: true,
        ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
      }
    }

    try {
      await sendEmail({
        to:      normalized,
        subject: `Your MEDLI verification code: ${otp}`,
        html:    buildOtpHtml(otp, normalized),
        text:    `Your MEDLI verification code is ${otp}. It expires in 5 minutes.`,
      })
      console.log(`[EMAIL OTP] sent to ${normalized}`)
      return { success: true }
    } catch (err) {
      console.error('[sendEmailOtp] SMTP error:', err?.message)
      await cache.del(otpKey(normalized))
      await cache.del(cooldownKey(normalized))
      return { success: false, error: 'Failed to send email. Please try again.' }
    }
  } catch (error) {
    console.error('[sendEmailOtp]', error)
    return { success: false, error: 'Internal error' }
  }
}

export async function verifyEmailOtp(email, otp) {
  try {
    const normalized = normalizeEmail(email)
    const otpClean   = String(otp || '').replace(/\D/g, '').trim()

    if (!normalized || !otpClean || otpClean.length !== OTP_LENGTH) {
      console.warn('[verifyEmailOtp] invalid input')
      return false
    }

    if (BYPASS_MODE() && otpClean === '123456') {
      await cache.del(otpKey(normalized))
      await cache.del(attemptKey(normalized))
      await cache.del(cooldownKey(normalized))
      console.log(`[EMAIL OTP BYPASS] ${normalized} verified with default OTP`)
      return true
    }

    const stored = await cache.get(otpKey(normalized))
    console.log(`[EMAIL OTP] verify lookup for ${normalized}: stored=${stored ? 'YES' : 'NO'}, entered=${otpClean}`)

    if (!stored) {
      console.warn(`[EMAIL OTP] no stored OTP for ${normalized}`)
      return false
    }

    const storedClean = String(stored).trim()
    if (storedClean !== otpClean) {
      console.warn(`[EMAIL OTP] mismatch for ${normalized}`)
      return false
    }

    await cache.del(otpKey(normalized))
    await cache.del(attemptKey(normalized))
    await cache.del(cooldownKey(normalized))
    console.log(`[EMAIL OTP] verified successfully for ${normalized}`)
    return true

  } catch (error) {
    console.error('[verifyEmailOtp]', error)
    return false
  }
}

export default { sendEmailOtp, verifyEmailOtp }