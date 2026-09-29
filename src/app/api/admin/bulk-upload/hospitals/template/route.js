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
      'Departments',
      'Services',
      'Platform Fee %',
    ]

    const sampleRows = [
      {
        'Name': 'Apollo Hospitals',
        'Contact Email': 'contact@apollo.example.com',
        'Contact Phone': '9876543210',
        'Address Line 1': 'Jubilee Hills, Road No. 1',
        'City': 'Hyderabad',
        'State': 'Telangana',
        'Pincode': '500033',
        'Latitude': 17.4239,
        'Longitude': 78.4084,
        'Departments': 'Cardiology, Neurology, Orthopedics, Pediatrics',
        'Services': 'ICU, 24/7 Pharmacy, Emergency, MRI, CT Scan',
        'Platform Fee %': 10,
      },
      {
        'Name': 'Fortis Hospital',
        'Contact Email': 'info@fortis.example.com',
        'Contact Phone': '9876543211',
        'Address Line 1': 'Bannerghatta Road',
        'City': 'Bangalore',
        'State': 'Karnataka',
        'Pincode': '560076',
        'Latitude': 12.8924,
        'Longitude': 77.5806,
        'Departments': 'Oncology, Gastroenterology, Nephrology',
        'Services': 'ICU, Blood Bank, Emergency, Dialysis',
        'Platform Fee %': 10,
      },
      {
        'Name': 'Max Super Speciality',
        'Contact Email': 'care@max.example.com',
        'Contact Phone': '9876543212',
        'Address Line 1': 'Saket, Press Enclave Road',
        'City': 'New Delhi',
        'State': 'Delhi',
        'Pincode': '110017',
        'Latitude': 28.5244,
        'Longitude': 77.2167,
        'Departments': 'Cardiology, Pulmonology',
        'Services': 'Emergency, ICU, Ventilator',
        'Platform Fee %': 12,
      },
    ]

    const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers })

    // Set column widths for readability
    ws['!cols'] = [
      { wch: 28 }, // Name
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 35 }, // Address
      { wch: 15 }, // City
      { wch: 15 }, // State
      { wch: 10 }, // Pincode
      { wch: 12 }, // Latitude
      { wch: 12 }, // Longitude
      { wch: 45 }, // Departments
      { wch: 40 }, // Services
      { wch: 14 }, // Platform Fee
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Hospitals')

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="hospital_upload_template.xlsx"',
      },
    })
  } catch (err) {
    console.error('[Hospital Template Download]', err)
    return NextResponse.json({ success: false, error: 'Failed to generate template' }, { status: 500 })
  }
}