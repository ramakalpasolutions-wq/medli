import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateUniqueSlug } from '@/lib/utils/slugify'
import * as XLSX from 'xlsx'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])

    console.log(`🏥 Parsing ${rows.length} hospital bulk entries...`)

    const results = { created: 0, failed: 0, errors: [] }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const name = String(row['Name'] || '').trim()
      const contactPhone = String(row['Contact Phone'] || '').trim()
      const contactEmail = String(row['Contact Email'] || '').trim().toLowerCase()
      const line1 = String(row['Address Line 1'] || '').trim()
      const city = String(row['City'] || '').trim()
      const state = String(row['State'] || '').trim()
      const pinCode = String(row['Pincode'] || row['Pin Code'] || '').trim()
      
      const lat = parseFloat(row['Latitude'])
      const lng = parseFloat(row['Longitude'])

      const deptsRaw = row['Departments'] || ''
      const servicesRaw = row['Services'] || ''
      const fee = parseFloat(row['Platform Fee %'] || 10)

      if (!name) {
        results.failed++
        results.errors.push(`Row ${i + 2}: Hospital Name is missing.`)
        continue;
      }

      try {
        const slug = await generateUniqueSlug(name, 'hospital')

        // Build spatial coordinates safely if coordinates are valid numbers
        const location = (!isNaN(lat) && !isNaN(lng)) 
          ? { type: 'Point', coordinates: [lng, lat] } // MongoDB expects [Longitude, Latitude]
          : undefined

        await prisma.hospital.create({
          data: {
            name,
            slug,
            contactPhone: contactPhone || null,
            contactEmail: contactEmail || null,
            address: {
              line1,
              city,
              state,
              pinCode,
            },
            location,
            departments: deptsRaw ? deptsRaw.split(',').map(d => d.trim()).filter(Boolean) : [],
            services: servicesRaw ? servicesRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
            platformFeePercent: fee,
            isApproved: true, // Bulk uploads by admin are auto-approved
            isActive: true,
            images: {
              cover: null,
              logo: null,
              gallery: [],
            },
            rating: {
              average: 0,
              count: 0
            }
          }
        })
        results.created++
      } catch (err) {
        console.error(`❌ Error inserting row ${i + 2}:`, err.message)
        results.failed++
        results.errors.push(`Row ${i + 2} (${name}): ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      data: results
    })

  } catch (err) {
    console.error('[Bulk Upload Hospitals Exception]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}