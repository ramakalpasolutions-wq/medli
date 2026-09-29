import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    const headers = [
      'Name',
      'Contact Email',
      'Contact Phone',
      'Address Line 1',
      'City',
      'State',
      'Pincode',
      'Latitude',
      'Longitude',
      'Certifications',
      'Platform Fee %',
    ]

    const sampleRows = [
      {
        'Name': 'Dr. Lal PathLabs',
        'Contact Email': 'support@lalpathlabs.example.com',
        'Contact Phone': '9876543220',
        'Address Line 1': 'Sector 18, Noida',
        'City': 'Noida',
        'State': 'Uttar Pradesh',
        'Pincode': '201301',
        'Latitude': 28.5672,
        'Longitude': 77.3211,
        'Certifications': 'NABL, ISO 15189, CAP',
        'Platform Fee %': 8,
      },
      {
        'Name': 'Thyrocare Technologies',
        'Contact Email': 'info@thyrocare.example.com',
        'Contact Phone': '9876543221',
        'Address Line 1': 'A-379, MIDC, Mahape',
        'City': 'Navi Mumbai',
        'State': 'Maharashtra',
        'Pincode': '400710',
        'Latitude': 19.1176,
        'Longitude': 73.0198,
        'Certifications': 'NABL, CAP',
        'Platform Fee %': 8,
      },
      {
        'Name': 'Metropolis Healthcare',
        'Contact Email': 'care@metropolis.example.com',
        'Contact Phone': '9876543222',
        'Address Line 1': 'T. Nagar, Usman Road',
        'City': 'Chennai',
        'State': 'Tamil Nadu',
        'Pincode': '600017',
        'Latitude': 13.0418,
        'Longitude': 80.2341,
        'Certifications': 'NABL, ISO 9001',
        'Platform Fee %': 9,
      },
    ]

    const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers })

    ws['!cols'] = [
      { wch: 28 }, // Name
      { wch: 32 }, // Email
      { wch: 15 }, // Phone
      { wch: 35 }, // Address
      { wch: 15 }, // City
      { wch: 18 }, // State
      { wch: 10 }, // Pincode
      { wch: 12 }, // Latitude
      { wch: 12 }, // Longitude
      { wch: 30 }, // Certifications
      { wch: 14 }, // Platform Fee
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Labs')

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="lab_upload_template.xlsx"',
      },
    })
  } catch (err) {
    console.error('[Lab Template Download]', err)
    return NextResponse.json({ success: false, error: 'Failed to generate template' }, { status: 500 })
  }
}