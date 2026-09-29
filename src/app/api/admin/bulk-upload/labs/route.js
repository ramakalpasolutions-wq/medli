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

    console.log(`🔬 Parsing ${rows.length} lab bulk entries...`)

    const results = { created: 0, failed: 0, errors: [] }

    // Fetch default templates to link to newly created labs
    const templates = await prisma.testTemplate.findMany({ where: { isActive: true } })

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

      const certsRaw = row['Certifications'] || ''
      const fee = parseFloat(row['Platform Fee %'] || 8)

      if (!name) {
        results.failed++
        results.errors.push(`Row ${i + 2}: Lab Name is missing.`)
        continue;
      }

      try {
        const slug = await generateUniqueSlug(name, 'lab')

        const location = (!isNaN(lat) && !isNaN(lng)) 
          ? { type: 'Point', coordinates: [lng, lat] }
          : undefined

        const lab = await prisma.lab.create({
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
            certifications: certsRaw ? certsRaw.split(',').map(c => c.trim()).filter(Boolean) : [],
            platformFeePercent: fee,
            isApproved: true,
            isActive: true,
            homeCollection: {
              enabled: false,
              areaCoverage: [],
              slots: [],
            },
            walkInSlots: [],
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

        // Instantly generate diagnostic test templates for this specific lab
        if (templates.length > 0) {
          const testPayloads = templates.map(tpl => ({
            labId: lab.id,
            templateId: tpl.id,
            name: tpl.name,
            code: tpl.code,
            category: tpl.category,
            parameters: tpl.parameters,
            price: tpl.suggestedPrice,
            sampleType: tpl.sampleType,
            preparationInstructions: tpl.preparationInstructions,
            turnaroundTime: tpl.turnaroundTime,
            isActive: false, // Remains inactive until custom lab admin toggles active
            isCustom: false
          }))

          await prisma.test.createMany({ data: testPayloads })
        }

        results.created++
      } catch (err) {
        console.error(`❌ Error inserting lab row ${i + 2}:`, err.message)
        results.failed++
        results.errors.push(`Row ${i + 2} (${name}): ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      data: results
    })

  } catch (err) {
    console.error('[Bulk Upload Labs Exception]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}