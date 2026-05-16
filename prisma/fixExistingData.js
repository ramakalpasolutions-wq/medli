// prisma/fixExistingData.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixData() {
  console.log('🔧 Fixing existing data...\n')

  /* ── HOSPITALS ── */
  const hospitals = await prisma.hospital.findMany()
  console.log(`Found ${hospitals.length} hospitals`)

  let hospFixed = 0
  for (const h of hospitals) {
    const updates = {}

    if (!h.rating || typeof h.rating.average !== 'number') {
      updates.rating = { average: 0, count: 0 }
    }
    if (!h.departments || h.departments.length === 0) {
      updates.departments = ['General Medicine']
    }
    if (!h.services || h.services.length === 0) {
      updates.services = ['Outpatient', 'Inpatient']
    }
    if (!h.operatingHours) {
      updates.operatingHours = {
        mon: { open: '09:00', close: '18:00', isOpen: true },
        tue: { open: '09:00', close: '18:00', isOpen: true },
        wed: { open: '09:00', close: '18:00', isOpen: true },
        thu: { open: '09:00', close: '18:00', isOpen: true },
        fri: { open: '09:00', close: '18:00', isOpen: true },
        sat: { open: '09:00', close: '14:00', isOpen: true },
        sun: { open: '00:00', close: '00:00', isOpen: false },
      }
    }
    if (!h.isApproved) {
      updates.isApproved = true   // auto-approve all existing
    }

    if (Object.keys(updates).length > 0) {
      await prisma.hospital.update({ where: { id: h.id }, data: updates })
      console.log(`  ✅ Fixed: ${h.name} (${Object.keys(updates).join(', ')})`)
      hospFixed++
    }
  }
  console.log(`✅ ${hospFixed} hospitals fixed\n`)

  /* ── LABS ── */
  const labs = await prisma.lab.findMany()
  console.log(`Found ${labs.length} labs`)

  let labFixed = 0
  for (const l of labs) {
    const updates = {}

    if (!l.rating || typeof l.rating.average !== 'number') {
      updates.rating = { average: 0, count: 0 }
    }
    if (!l.certifications || l.certifications.length === 0) {
      updates.certifications = ['Diagnostic Services']
    }
    if (!l.homeCollection) {
      updates.homeCollection = { enabled: false, areaCoverage: [], slots: [] }
    }
    if (!l.isApproved) {
      updates.isApproved = true
    }

    if (Object.keys(updates).length > 0) {
      await prisma.lab.update({ where: { id: l.id }, data: updates })
      console.log(`  ✅ Fixed: ${l.name} (${Object.keys(updates).join(', ')})`)
      labFixed++
    }
  }
  console.log(`✅ ${labFixed} labs fixed\n`)

  /* ── DOCTORS ── */
  const doctors = await prisma.doctor.findMany()
  console.log(`Found ${doctors.length} doctors`)

  let docFixed = 0
  for (const d of doctors) {
    const updates = {}

    if (!d.rating || typeof d.rating.average !== 'number') {
      updates.rating = { average: 0, count: 0 }
    }
    if (!d.specialization || d.specialization.length === 0) {
      updates.specialization = ['General Physician']
    }
    if (!d.qualifications || d.qualifications.length === 0) {
      updates.qualifications = ['MBBS']
    }
    if (!d.consultationTypes || d.consultationTypes.length === 0) {
      updates.consultationTypes = ['offline']
    }
    if (!d.consultationFee) {
      updates.consultationFee = { online: 0, offline: 500 }
    }
    if (!d.availability || d.availability.length === 0) {
      updates.availability = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
        dayOfWeek,
        startTime:    '09:00',
        endTime:      '17:00',
        slotDuration: 30,
      }))
    }
    if (!d.isVerified) {
      updates.isVerified = true   // auto-verify all existing
    }

    if (Object.keys(updates).length > 0) {
      await prisma.doctor.update({ where: { id: d.id }, data: updates })
      console.log(`  ✅ Fixed: Dr. ${d.name} (${Object.keys(updates).join(', ')})`)
      docFixed++
    }
  }
  console.log(`✅ ${docFixed} doctors fixed\n`)

  console.log('🎉 All existing data fixed!')
}

fixData()
  .catch((err) => {
    console.error('❌ Fatal:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })