// src/lib/utils/cloudflare.js
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const S3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.CF_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY,
  },
})

const BUCKET  = process.env.CF_R2_BUCKET_NAME || 'medli-storage'
const CDN_URL = process.env.CF_R2_CDN_URL     || 'https://cdn.medli.in'

export const R2Keys = {
  hospitalCover:   (id)              => `hospitals/${id}/cover`,
  hospitalLogo:    (id)              => `hospitals/${id}/logo`,
  hospitalGallery: (id, filename)    => `hospitals/${id}/gallery/${filename}`,
  labCover:        (id)              => `labs/${id}/cover`,
  labLogo:         (id)              => `labs/${id}/logo`,
  labGallery:      (id, filename)    => `labs/${id}/gallery/${filename}`,
  labReport:       (bookingId, fn)   => `reports/${bookingId}/${fn}`,
  doctorAvatar:    (id)              => `doctors/${id}/avatar`,
  userAvatar:      (id)              => `users/${id}/avatar`,
}

export async function uploadToR2({ key, buffer, contentType }) {
  const command = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: contentType,
  })
  await S3.send(command)
  return { key, url: getPublicUrl(key) }
}

export function getPublicUrl(key) {
  return `${CDN_URL}/${key}`
}

export async function getSignedDownloadUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  return getSignedUrl(S3, command, { expiresIn })
}

export async function getPresignedUploadUrl({ key, contentType, expiresIn = 300 }) {
  const command = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    ContentType: contentType,
  })
  const url = await getSignedUrl(S3, command, { expiresIn })
  return { presignedUrl: url, key, publicUrl: getPublicUrl(key) }
}

export async function deleteFromR2(key) {
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  await S3.send(command)
  return { deleted: true, key }
}