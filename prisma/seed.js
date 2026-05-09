const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slug(text) {
  return text.toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-')
}

function bookingId() {
  return `BK-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
}

function invoiceNumber() {
  return `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
}

function settlementNumber() {
  return `STL-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
}

function refundNumber() {
  return `REF-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
}

function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

function hoursFromNow(n) {
  return new Date(Date.now() + n * 60 * 60 * 1000)
}

// Guntur coordinates
const GUNTUR = { lat: 16.3067, lng: 80.4365 }

function nearGuntur(offsetLat = 0, offsetLng = 0) {
  return {
    type: 'Point',
    coordinates: [
      GUNTUR.lng + offsetLng,
      GUNTUR.lat + offsetLat,
    ],
  }
}

const GUNTUR_ADDRESS = (line1) => ({
  line1,
  city:    'Guntur',
  state:   'Andhra Pradesh',
  pinCode: '522001',
})

// ─── Main Seed ────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting MEDLI seed for Guntur...\n')

  // ── 1. Clean existing data ──────────────────────────────────────────────────
  console.log('🧹 Cleaning existing data...')
  await prisma.auditLog.deleteMany()
  await prisma.notificationLog.deleteMany()
  await prisma.ledger.deleteMany()
  await prisma.couponUsage.deleteMany()
  await prisma.coupon.deleteMany()
  await prisma.refund.deleteMany()
  await prisma.settlement.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.test.deleteMany()
  await prisma.doctor.deleteMany()
  await prisma.bankAccount.deleteMany()
  await prisma.lab.deleteMany()
  await prisma.hospital.deleteMany()
  await prisma.region.deleteMany()
  await prisma.platformSetting.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Clean done\n')

  // ── 2. Hash password ────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Password@123', 12)

  // ── 3. Region ───────────────────────────────────────────────────────────────
  console.log('📍 Creating region...')
  const region = await prisma.region.create({
    data: {
      name:     'Andhra Pradesh South',
      states:   ['Andhra Pradesh'],
      cities:   ['Guntur', 'Vijayawada', 'Tenali', 'Narasaraopet', 'Mangalagiri'],
      isActive: true,
    },
  })
  console.log(`   ✅ Region: ${region.name}`)

  // ── 4. Users ─────────────────────────────────────────────────────────────────
  console.log('\n👤 Creating users...')

  const superAdmin = await prisma.user.create({
    data: {
      name:         'MEDLI Super Admin',
      email:        'admin@medli.in',
      phone:        '9000000001',
      role:         'super_admin',
      passwordHash,
      isVerified:   true,
      wallet:       { balance: 0 },
    },
  })

  const regionalManager = await prisma.user.create({
    data: {
      name:         'Ravi Kumar',
      email:        'ravi.regional@medli.in',
      phone:        '9000000002',
      role:         'regional_manager',
      passwordHash,
      isVerified:   true,
      wallet:       { balance: 0 },
    },
  })

  // Update region with manager
  await prisma.region.update({
    where: { id: region.id },
    data:  { managerId: regionalManager.id },
  })

  const hospitalAdmin1 = await prisma.user.create({
    data: {
      name:         'Dr. Suresh Babu',
      email:        'admin@gunturhospital.in',
      phone:        '9000000003',
      role:         'hospital_admin',
      passwordHash,
      isVerified:   true,
      wallet:       { balance: 0 },
    },
  })

  const hospitalAdmin2 = await prisma.user.create({
    data: {
      name:         'Lakshmi Devi',
      email:        'admin@apolloguntur.in',
      phone:        '9000000004',
      role:         'hospital_admin',
      passwordHash,
      isVerified:   true,
      wallet:       { balance: 0 },
    },
  })

  const labAdmin1 = await prisma.user.create({
    data: {
      name:         'Prasad Rao',
      email:        'admin@sridiagnostics.in',
      phone:        '9000000005',
      role:         'lab_admin',
      passwordHash,
      isVerified:   true,
      wallet:       { balance: 0 },
    },
  })

  const labAdmin2 = await prisma.user.create({
    data: {
      name:         'Vijaya Lakshmi',
      email:        'admin@thyrocareguntur.in',
      phone:        '9000000006',
      role:         'lab_admin',
      passwordHash,
      isVerified:   true,
      wallet:       { balance: 0 },
    },
  })

  const doctorUser1 = await prisma.user.create({
    data: {
      name:         'Dr. Venkata Rao',
      email:        'dr.venkata@medli.in',
      phone:        '9000000007',
      role:         'doctor',
      passwordHash,
      isVerified:   true,
      wallet:       { balance: 0 },
    },
  })

  const doctorUser2 = await prisma.user.create({
    data: {
      name:         'Dr. Anitha Kumari',
      email:        'dr.anitha@medli.in',
      phone:        '9000000008',
      role:         'doctor',
      passwordHash,
      isVerified:   true,
      wallet:       { balance: 0 },
    },
  })

  const doctorUser3 = await prisma.user.create({
    data: {
      name:         'Dr. Ramesh Chandra',
      email:        'dr.ramesh@medli.in',
      phone:        '9000000009',
      role:         'doctor',
      passwordHash,
      isVerified:   true,
      wallet:       { balance: 0 },
    },
  })

  const doctorUser4 = await prisma.user.create({
    data: {
      name:         'Dr. Padmavathi',
      email:        'dr.padmavathi@medli.in',
      phone:        '9000000010',
      role:         'doctor',
      passwordHash,
      isVerified:   true,
      wallet:       { balance: 0 },
    },
  })

  const patient1 = await prisma.user.create({
    data: {
      name:         'Srinivas Murthy',
      email:        'srinivas@gmail.com',
      phone:        '9100000001',
      role:         'user',
      passwordHash,
      isVerified:   true,
      wallet:       { balance: 250 },
    },
  })

  const patient2 = await prisma.user.create({
    data: {
      name:         'Kavitha Reddy',
      email:        'kavitha@gmail.com',
      phone:        '9100000002',
      role:         'user',
      passwordHash,
      isVerified:   true,
      wallet:       { balance: 100 },
    },
  })

  const patient3 = await prisma.user.create({
    data: {
      name:         'Nagaraju Patel',
      email:        'nagaraju@gmail.com',
      phone:        '9100000003',
      role:         'user',
      passwordHash,
      isVerified:   false,
      wallet:       { balance: 0 },
    },
  })

  const patient4 = await prisma.user.create({
    data: {
      name:         'Sarada Devi',
      email:        'sarada@gmail.com',
      phone:        '9100000004',
      role:         'user',
      passwordHash,
      isVerified:   true,
      wallet:       { balance: 500 },
    },
  })

  console.log(`   ✅ Created ${14} users (1 super_admin, 1 regional, 2 hospital_admin, 2 lab_admin, 4 doctors, 4 patients)`)

  // ── 5. Hospitals ─────────────────────────────────────────────────────────────
  console.log('\n🏥 Creating hospitals...')

  const hospital1 = await prisma.hospital.create({
    data: {
      name:               'Guntur Government General Hospital',
      slug:               'guntur-government-general-hospital',
      address:            GUNTUR_ADDRESS('Collector Office Road, Arundelpet'),
      location:           nearGuntur(0, 0),
      departments:        ['Cardiology', 'Neurology', 'Orthopedics', 'General Medicine', 'Pediatrics', 'Gynecology', 'ENT', 'Ophthalmology'],
      services:           ['Emergency', 'ICU', 'Surgery', 'Blood Bank', 'Pharmacy', 'Radiology'],
      images:             { cover: null, logo: null, gallery: [] },
      contactPhone:       '08632234567',
      contactEmail:       'admin@gunturhospital.in',
      operatingHours:     {
        mon: { open: '08:00', close: '20:00', isOpen: true },
        tue: { open: '08:00', close: '20:00', isOpen: true },
        wed: { open: '08:00', close: '20:00', isOpen: true },
        thu: { open: '08:00', close: '20:00', isOpen: true },
        fri: { open: '08:00', close: '20:00', isOpen: true },
        sat: { open: '08:00', close: '14:00', isOpen: true },
        sun: { open: null,    close: null,    isOpen: false },
      },
      rating:             { average: 4.2, count: 856 },
      isApproved:         true,
      isActive:           true,
      adminUserId:        hospitalAdmin1.id,
      regionId:           region.id,
      platformFeePercent: 10,
    },
  })

  const hospital2 = await prisma.hospital.create({
    data: {
      name:               'Apollo Hospitals Guntur',
      slug:               'apollo-hospitals-guntur',
      address:            GUNTUR_ADDRESS('Brodipet, Main Road'),
      location:           nearGuntur(0.01, 0.01),
      departments:        ['Cardiac Sciences', 'Oncology', 'Neurosciences', 'Gastroenterology', 'Nephrology', 'Urology', 'Dermatology'],
      services:           ['24/7 Emergency', 'Cath Lab', 'NICU', 'Bone Marrow Transplant', 'Dialysis'],
      images:             { cover: null, logo: null, gallery: [] },
      contactPhone:       '08632256789',
      contactEmail:       'admin@apolloguntur.in',
      operatingHours:     {
        mon: { open: '00:00', close: '23:59', isOpen: true },
        tue: { open: '00:00', close: '23:59', isOpen: true },
        wed: { open: '00:00', close: '23:59', isOpen: true },
        thu: { open: '00:00', close: '23:59', isOpen: true },
        fri: { open: '00:00', close: '23:59', isOpen: true },
        sat: { open: '00:00', close: '23:59', isOpen: true },
        sun: { open: '00:00', close: '23:59', isOpen: true },
      },
      rating:             { average: 4.6, count: 1243 },
      isApproved:         true,
      isActive:           true,
      adminUserId:        hospitalAdmin2.id,
      regionId:           region.id,
      platformFeePercent: 10,
    },
  })

  const hospital3 = await prisma.hospital.create({
    data: {
      name:               'Sri Rama Nursing Home',
      slug:               'sri-rama-nursing-home-guntur',
      address:            GUNTUR_ADDRESS('Lakshmipuram, 4th Lane'),
      location:           nearGuntur(-0.01, 0.005),
      departments:        ['General Medicine', 'Surgery', 'Maternity', 'Pediatrics'],
      services:           ['Maternity Care', 'Minor Surgery', 'Vaccination', 'Physiotherapy'],
      images:             { cover: null, logo: null, gallery: [] },
      contactPhone:       '08632278901',
      contactEmail:       'srirama@hospital.in',
      operatingHours:     {
        mon: { open: '09:00', close: '21:00', isOpen: true },
        tue: { open: '09:00', close: '21:00', isOpen: true },
        wed: { open: '09:00', close: '21:00', isOpen: true },
        thu: { open: '09:00', close: '21:00', isOpen: true },
        fri: { open: '09:00', close: '21:00', isOpen: true },
        sat: { open: '09:00', close: '18:00', isOpen: true },
        sun: { open: '09:00', close: '13:00', isOpen: true },
      },
      rating:             { average: 4.0, count: 312 },
      isApproved:         false,
      isActive:           true,
      adminUserId:        null,
      regionId:           region.id,
      platformFeePercent: 10,
    },
  })

  const hospital4 = await prisma.hospital.create({
    data: {
      name:               'Vijaya Multi Speciality Hospital',
      slug:               'vijaya-multi-speciality-hospital-guntur',
      address:            GUNTUR_ADDRESS('Kothapet, Ring Road'),
      location:           nearGuntur(0.02, -0.01),
      departments:        ['Orthopedics', 'Spine Surgery', 'Joint Replacement', 'Sports Medicine', 'Rheumatology'],
      services:           ['Robotic Surgery', 'Arthroscopy', 'Physiotherapy', 'Pain Management'],
      images:             { cover: null, logo: null, gallery: [] },
      contactPhone:       '08632290123',
      contactEmail:       'vijaya@hospital.in',
      operatingHours:     {
        mon: { open: '08:00', close: '20:00', isOpen: true },
        tue: { open: '08:00', close: '20:00', isOpen: true },
        wed: { open: '08:00', close: '20:00', isOpen: true },
        thu: { open: '08:00', close: '20:00', isOpen: true },
        fri: { open: '08:00', close: '20:00', isOpen: true },
        sat: { open: '08:00', close: '16:00', isOpen: true },
        sun: { open: null,    close: null,    isOpen: false },
      },
      rating:             { average: 4.4, count: 528 },
      isApproved:         true,
      isActive:           true,
      adminUserId:        null,
      regionId:           region.id,
      platformFeePercent: 10,
    },
  })

  console.log(`   ✅ Created 4 hospitals`)

  // ── 6. Bank Accounts for Hospitals ──────────────────────────────────────────
  console.log('\n🏦 Creating bank accounts...')

  const hospitalBank1 = await prisma.bankAccount.create({
    data: {
      entityType:        'hospital',
      entityId:           hospital1.id,
      accountHolderName: 'Guntur General Hospital Trust',
      accountNumber:     'ENC_1234567890123456',
      ifscCode:          'SBIN0001234',
      bankName:          'State Bank of India',
      branchName:        'Guntur Main Branch',
      accountType:       'current',
      gstin:             '37AAACT1234A1Z5',
      isVerified:        true,
      verificationMethod:'manual',
      verifiedAt:        new Date(),
      verifiedBy:        superAdmin.id,
      isPrimary:         true,
      isActive:          true,
    },
  })

  const hospitalBank2 = await prisma.bankAccount.create({
    data: {
      entityType:        'hospital',
      entityId:           hospital2.id,
      accountHolderName: 'Apollo Hospitals Guntur Pvt Ltd',
      accountNumber:     'ENC_9876543210987654',
      ifscCode:          'HDFC0004567',
      bankName:          'HDFC Bank',
      branchName:        'Brodipet Branch',
      accountType:       'current',
      gstin:             '37AABCA5678B1Z3',
      isVerified:        true,
      verificationMethod:'penny_drop',
      verifiedAt:        new Date(),
      verifiedBy:        superAdmin.id,
      isPrimary:         true,
      isActive:          true,
    },
  })

  // Update hospitals with bank account IDs
  await prisma.hospital.update({ where: { id: hospital1.id }, data: { bankAccountId: hospitalBank1.id } })
  await prisma.hospital.update({ where: { id: hospital2.id }, data: { bankAccountId: hospitalBank2.id } })

  console.log('   ✅ Hospital bank accounts created')

  // ── 7. Doctors ───────────────────────────────────────────────────────────────
  console.log('\n👨‍⚕️ Creating doctors...')

  const weekdayAvailability = [1, 2, 3, 4, 5].map((day) => ({
    dayOfWeek:    day,
    startTime:    '09:00',
    endTime:      '17:00',
    slotDuration: 10,
  }))

  const satAvailability = [{
    dayOfWeek:    6,
    startTime:    '09:00',
    endTime:      '13:00',
    slotDuration: 10,
  }]

  const doctor1 = await prisma.doctor.create({
    data: {
      userId:            doctorUser1.id,
      hospitalId:        hospital1.id,
      name:              'Venkata Rao Manikanta',
      specialization:    ['Cardiologist', 'Interventional Cardiology'],
      qualifications:    ['MBBS', 'MD (Medicine)', 'DM (Cardiology)'],
      experience:        18,
      consultationFee:   { online: 700, offline: 500 },
      consultationTypes: ['offline', 'online'],
      availability:      [...weekdayAvailability, ...satAvailability],
      exceptions:        [],
      isVerified:        true,
      isActive:          true,
      rating:            { average: 4.7, count: 423 },
    },
  })

  const doctor2 = await prisma.doctor.create({
    data: {
      userId:            doctorUser2.id,
      hospitalId:        hospital1.id,
      name:              'Anitha Kumari Reddy',
      specialization:    ['Gynecologist', 'Obstetrician'],
      qualifications:    ['MBBS', 'MS (OBG)', 'FMAS'],
      experience:        14,
      consultationFee:   { online: 600, offline: 400 },
      consultationTypes: ['offline', 'online'],
      availability:      weekdayAvailability,
      exceptions:        [],
      isVerified:        true,
      isActive:          true,
      rating:            { average: 4.8, count: 612 },
    },
  })

  const doctor3 = await prisma.doctor.create({
    data: {
      userId:            doctorUser3.id,
      hospitalId:        hospital2.id,
      name:              'Ramesh Chandra Naidu',
      specialization:    ['Neurologist', 'Epileptologist'],
      qualifications:    ['MBBS', 'MD (Medicine)', 'DM (Neurology)'],
      experience:        22,
      consultationFee:   { online: 1000, offline: 800 },
      consultationTypes: ['offline', 'online'],
      availability:      [
        ...weekdayAvailability,
        { dayOfWeek: 6, startTime: '10:00', endTime: '14:00', slotDuration: 15 },
      ],
      exceptions:        [],
      isVerified:        true,
      isActive:          true,
      rating:            { average: 4.9, count: 891 },
    },
  })

  const doctor4 = await prisma.doctor.create({
    data: {
      userId:            doctorUser4.id,
      hospitalId:        hospital2.id,
      name:              'Padmavathi Subrahmanyam',
      specialization:    ['Dermatologist', 'Cosmetologist'],
      qualifications:    ['MBBS', 'MD (Dermatology)', 'FAAD'],
      experience:        10,
      consultationFee:   { online: 800, offline: 600 },
      consultationTypes: ['offline', 'online'],
      availability:      weekdayAvailability,
      exceptions:        [],
      isVerified:        true,
      isActive:          true,
      rating:            { average: 4.6, count: 334 },
    },
  })

  const doctor5 = await prisma.doctor.create({
    data: {
      userId:            null,
      hospitalId:        hospital4.id,
      name:              'Krishnamurthy Venkat',
      specialization:    ['Orthopedic Surgeon', 'Joint Replacement'],
      qualifications:    ['MBBS', 'MS (Ortho)', 'Fellowship in Joint Replacement'],
      experience:        16,
      consultationFee:   { online: 900, offline: 700 },
      consultationTypes: ['offline'],
      availability:      weekdayAvailability,
      exceptions:        [],
      isVerified:        true,
      isActive:          true,
      rating:            { average: 4.5, count: 267 },
    },
  })

  const doctor6 = await prisma.doctor.create({
    data: {
      userId:            null,
      hospitalId:        hospital1.id,
      name:              'Siva Sankara Rao',
      specialization:    ['General Physician', 'Diabetologist'],
      qualifications:    ['MBBS', 'MD (General Medicine)'],
      experience:        12,
      consultationFee:   { online: 400, offline: 300 },
      consultationTypes: ['offline', 'online'],
      availability:      [
        ...weekdayAvailability,
        { dayOfWeek: 0, startTime: '10:00', endTime: '13:00', slotDuration: 10 },
      ],
      exceptions:        [],
      isVerified:        false,
      isActive:          true,
      rating:            { average: 4.1, count: 156 },
    },
  })

  console.log('   ✅ Created 6 doctors')

  // ── 8. Labs ──────────────────────────────────────────────────────────────────
  console.log('\n🧪 Creating labs...')

  const lab1 = await prisma.lab.create({
    data: {
      name:               'Sri Diagnostics Centre',
      slug:               'sri-diagnostics-centre-guntur',
      address:            GUNTUR_ADDRESS('Brodipet, 2nd Cross Road'),
      location:           nearGuntur(0.005, 0.008),
      images:             { cover: null, logo: null, gallery: [] },
      certifications:     ['NABL', 'ISO 15189:2022', 'CAP'],
      homeCollection:     {
        enabled:      true,
        areaCoverage: ['Brodipet', 'Arundelpet', 'Lakshmipuram', 'Kothapet', 'Nallapadu', 'Pattabhipuram'],
        slots: [
          { dayOfWeek: 1, startTime: '06:00', endTime: '09:00' },
          { dayOfWeek: 2, startTime: '06:00', endTime: '09:00' },
          { dayOfWeek: 3, startTime: '06:00', endTime: '09:00' },
          { dayOfWeek: 4, startTime: '06:00', endTime: '09:00' },
          { dayOfWeek: 5, startTime: '06:00', endTime: '09:00' },
          { dayOfWeek: 6, startTime: '06:00', endTime: '08:00' },
        ],
      },
      walkInSlots: [
        { dayOfWeek: 1, startTime: '07:00', endTime: '20:00' },
        { dayOfWeek: 2, startTime: '07:00', endTime: '20:00' },
        { dayOfWeek: 3, startTime: '07:00', endTime: '20:00' },
        { dayOfWeek: 4, startTime: '07:00', endTime: '20:00' },
        { dayOfWeek: 5, startTime: '07:00', endTime: '20:00' },
        { dayOfWeek: 6, startTime: '07:00', endTime: '16:00' },
        { dayOfWeek: 0, startTime: '08:00', endTime: '13:00' },
      ],
      contactPhone:       '08632345678',
      contactEmail:       'admin@sridiagnostics.in',
      rating:             { average: 4.5, count: 723 },
      isApproved:         true,
      isActive:           true,
      adminUserId:        labAdmin1.id,
      regionId:           region.id,
      platformFeePercent: 8,
    },
  })

  const lab2 = await prisma.lab.create({
    data: {
      name:               'Thyrocare Guntur Collection Centre',
      slug:               'thyrocare-guntur-collection-centre',
      address:            GUNTUR_ADDRESS('Amaravathi Road, Near Bus Stand'),
      location:           nearGuntur(-0.008, -0.006),
      images:             { cover: null, logo: null, gallery: [] },
      certifications:     ['NABL', 'ISO 9001:2015'],
      homeCollection:     {
        enabled:      true,
        areaCoverage: ['Guntur City', 'Mangalagiri', 'Tenali Road', 'Pedakakani'],
        slots: [
          { dayOfWeek: 1, startTime: '06:00', endTime: '10:00' },
          { dayOfWeek: 2, startTime: '06:00', endTime: '10:00' },
          { dayOfWeek: 3, startTime: '06:00', endTime: '10:00' },
          { dayOfWeek: 4, startTime: '06:00', endTime: '10:00' },
          { dayOfWeek: 5, startTime: '06:00', endTime: '10:00' },
          { dayOfWeek: 6, startTime: '06:00', endTime: '08:00' },
          { dayOfWeek: 0, startTime: '06:00', endTime: '08:00' },
        ],
      },
      walkInSlots: [
        { dayOfWeek: 1, startTime: '07:00', endTime: '18:00' },
        { dayOfWeek: 2, startTime: '07:00', endTime: '18:00' },
        { dayOfWeek: 3, startTime: '07:00', endTime: '18:00' },
        { dayOfWeek: 4, startTime: '07:00', endTime: '18:00' },
        { dayOfWeek: 5, startTime: '07:00', endTime: '18:00' },
        { dayOfWeek: 6, startTime: '07:00', endTime: '14:00' },
      ],
      contactPhone:       '08632367890',
      contactEmail:       'admin@thyrocareguntur.in',
      rating:             { average: 4.3, count: 456 },
      isApproved:         true,
      isActive:           true,
      adminUserId:        labAdmin2.id,
      regionId:           region.id,
      platformFeePercent: 8,
    },
  })

  const lab3 = await prisma.lab.create({
    data: {
      name:               'Vijaya Diagnostic Centre',
      slug:               'vijaya-diagnostic-centre-guntur',
      address:            GUNTUR_ADDRESS('Nallakunta, Guntur'),
      location:           nearGuntur(0.015, -0.012),
      images:             { cover: null, logo: null, gallery: [] },
      certifications:     ['ISO 15189:2022'],
      homeCollection:     {
        enabled:      false,
        areaCoverage: [],
        slots:        [],
      },
      walkInSlots: [
        { dayOfWeek: 1, startTime: '08:00', endTime: '19:00' },
        { dayOfWeek: 2, startTime: '08:00', endTime: '19:00' },
        { dayOfWeek: 3, startTime: '08:00', endTime: '19:00' },
        { dayOfWeek: 4, startTime: '08:00', endTime: '19:00' },
        { dayOfWeek: 5, startTime: '08:00', endTime: '19:00' },
        { dayOfWeek: 6, startTime: '08:00', endTime: '15:00' },
      ],
      contactPhone:       '08632389012',
      contactEmail:       'vijaya@diagnostics.in',
      rating:             { average: 4.1, count: 234 },
      isApproved:         false,
      isActive:           true,
      adminUserId:        null,
      regionId:           region.id,
      platformFeePercent: 8,
    },
  })

  console.log('   ✅ Created 3 labs')

  // ── 9. Lab Bank Accounts ─────────────────────────────────────────────────────
  const labBank1 = await prisma.bankAccount.create({
    data: {
      entityType:        'lab',
      entityId:           lab1.id,
      accountHolderName: 'Sri Diagnostics Centre',
      accountNumber:     'ENC_5544332211009988',
      ifscCode:          'ICIC0002345',
      bankName:          'ICICI Bank',
      branchName:        'Guntur Brodipet Branch',
      accountType:       'current',
      gstin:             '37AABCS1234C1Z7',
      isVerified:        true,
      verificationMethod:'penny_drop',
      verifiedAt:        new Date(),
      verifiedBy:        superAdmin.id,
      isPrimary:         true,
      isActive:          true,
    },
  })

  await prisma.lab.update({ where: { id: lab1.id }, data: { bankAccountId: labBank1.id } })
  console.log('   ✅ Lab bank accounts created')

  // ── 10. Tests ─────────────────────────────────────────────────────────────────
  console.log('\n🔬 Creating lab tests...')

  const testsLab1 = [
    // Haematology
    { name: 'Complete Blood Count (CBC)',      code: 'CBC001',  category: 'Haematology',    price: 250,  discountedPrice: 199,  sampleType: 'Blood', parameters: ['WBC', 'RBC', 'Haemoglobin', 'Haematocrit', 'MCV', 'MCH', 'MCHC', 'Platelets', 'Neutrophils', 'Lymphocytes'], turnaroundTime: { value: 4, unit: 'hours' }, preparationInstructions: 'No fasting required' },
    { name: 'Erythrocyte Sedimentation Rate', code: 'ESR001',  category: 'Haematology',    price: 120,  discountedPrice: null, sampleType: 'Blood', parameters: ['ESR'],                                                              turnaroundTime: { value: 2, unit: 'hours' }, preparationInstructions: null },
    { name: 'Peripheral Blood Smear',         code: 'PBS001',  category: 'Haematology',    price: 200,  discountedPrice: null, sampleType: 'Blood', parameters: ['RBC Morphology', 'WBC Differential', 'Platelet Morphology'],        turnaroundTime: { value: 6, unit: 'hours' }, preparationInstructions: null },
    // Biochemistry
    { name: 'Fasting Blood Glucose',          code: 'FBG001',  category: 'Biochemistry',   price: 80,   discountedPrice: 60,   sampleType: 'Blood', parameters: ['Glucose (Fasting)'],                                               turnaroundTime: { value: 2, unit: 'hours' }, preparationInstructions: '8-10 hours fasting required' },
    { name: 'HbA1c (Glycated Haemoglobin)',   code: 'HBA001',  category: 'Biochemistry',   price: 450,  discountedPrice: 380,  sampleType: 'Blood', parameters: ['HbA1c %', 'Average Blood Glucose'],                               turnaroundTime: { value: 4, unit: 'hours' }, preparationInstructions: 'No fasting required' },
    { name: 'Lipid Profile',                  code: 'LIP001',  category: 'Biochemistry',   price: 550,  discountedPrice: 450,  sampleType: 'Blood', parameters: ['Total Cholesterol', 'LDL', 'HDL', 'VLDL', 'Triglycerides', 'LDL/HDL Ratio'], turnaroundTime: { value: 4, unit: 'hours' }, preparationInstructions: '12 hours fasting required' },
    { name: 'Liver Function Test (LFT)',       code: 'LFT001',  category: 'Biochemistry',   price: 600,  discountedPrice: 499,  sampleType: 'Blood', parameters: ['SGOT', 'SGPT', 'ALP', 'GGT', 'Total Bilirubin', 'Direct Bilirubin', 'Total Protein', 'Albumin', 'Globulin'], turnaroundTime: { value: 4, unit: 'hours' }, preparationInstructions: 'Avoid fatty food before test' },
    { name: 'Kidney Function Test (KFT)',      code: 'KFT001',  category: 'Biochemistry',   price: 500,  discountedPrice: 420,  sampleType: 'Blood', parameters: ['Urea', 'Creatinine', 'Uric Acid', 'eGFR', 'BUN', 'Electrolytes'], turnaroundTime: { value: 4, unit: 'hours' }, preparationInstructions: 'Avoid excessive water intake' },
    { name: 'Thyroid Profile (T3, T4, TSH)',   code: 'THY001',  category: 'Thyroid',        price: 750,  discountedPrice: 599,  sampleType: 'Blood', parameters: ['T3', 'T4', 'TSH'],                                               turnaroundTime: { value: 6, unit: 'hours' }, preparationInstructions: 'Collect sample before thyroid medication' },
    { name: 'Free T3, Free T4, TSH',           code: 'FTH001',  category: 'Thyroid',        price: 950,  discountedPrice: 799,  sampleType: 'Blood', parameters: ['Free T3', 'Free T4', 'TSH'],                                     turnaroundTime: { value: 6, unit: 'hours' }, preparationInstructions: null },
    // Urine
    { name: 'Urine Routine Examination',       code: 'URE001',  category: 'Urine Analysis', price: 100,  discountedPrice: 80,   sampleType: 'Urine', parameters: ['Colour', 'Clarity', 'pH', 'Protein', 'Glucose', 'Ketones', 'Blood', 'Pus Cells', 'RBCs', 'Casts'], turnaroundTime: { value: 2, unit: 'hours' }, preparationInstructions: 'Collect midstream urine in sterile container' },
    { name: 'Urine Culture & Sensitivity',     code: 'UCS001',  category: 'Urine Analysis', price: 450,  discountedPrice: null, sampleType: 'Urine', parameters: ['Organism', 'Colony Count', 'Antibiotic Sensitivity'],             turnaroundTime: { value: 2, unit: 'days' }, preparationInstructions: 'Collect midstream urine before antibiotics' },
    // Serology
    { name: 'Dengue NS1 Antigen + IgM + IgG', code: 'DNG001',  category: 'Serology',       price: 900,  discountedPrice: 749,  sampleType: 'Blood', parameters: ['NS1 Antigen', 'IgM Antibody', 'IgG Antibody'],                   turnaroundTime: { value: 4, unit: 'hours' }, preparationInstructions: null },
    { name: 'Malaria Antigen Test',            code: 'MAL001',  category: 'Serology',       price: 350,  discountedPrice: null, sampleType: 'Blood', parameters: ['Plasmodium falciparum', 'Plasmodium vivax'],                       turnaroundTime: { value: 2, unit: 'hours' }, preparationInstructions: null },
    { name: 'Typhoid (Widal Test)',            code: 'WID001',  category: 'Serology',       price: 200,  discountedPrice: null, sampleType: 'Blood', parameters: ['S. Typhi O', 'S. Typhi H', 'S. Para A', 'S. Para B'],            turnaroundTime: { value: 4, unit: 'hours' }, preparationInstructions: null },
    { name: 'COVID-19 RT-PCR',                 code: 'COV001',  category: 'Serology',       price: 800,  discountedPrice: null, sampleType: 'Nasopharyngeal Swab', parameters: ['SARS-CoV-2 RNA'],                                   turnaroundTime: { value: 24, unit: 'hours' }, preparationInstructions: 'Do not eat/drink 30min before' },
    // Hormones
    { name: 'Vitamin D (25-OH)',               code: 'VTD001',  category: 'Vitamins',       price: 1200, discountedPrice: 999,  sampleType: 'Blood', parameters: ['25-Hydroxy Vitamin D'],                                           turnaroundTime: { value: 8, unit: 'hours' }, preparationInstructions: null },
    { name: 'Vitamin B12',                     code: 'VTB001',  category: 'Vitamins',       price: 800,  discountedPrice: 650,  sampleType: 'Blood', parameters: ['Cyanocobalamin'],                                                 turnaroundTime: { value: 6, unit: 'hours' }, preparationInstructions: null },
    { name: 'Iron Studies',                    code: 'IRN001',  category: 'Biochemistry',   price: 650,  discountedPrice: 549,  sampleType: 'Blood', parameters: ['Serum Iron', 'TIBC', 'UIBC', 'Transferrin Saturation', 'Ferritin'], turnaroundTime: { value: 6, unit: 'hours' }, preparationInstructions: '8 hours fasting' },
    // Packages
    { name: 'Aarogyam Basic Package',          code: 'PKG001',  category: 'Health Packages', price: 1999, discountedPrice: 1499, sampleType: 'Blood + Urine', parameters: ['CBC', 'Blood Sugar Fasting', 'Lipid Profile', 'LFT', 'KFT', 'Thyroid TSH', 'Urine Routine'], turnaroundTime: { value: 12, unit: 'hours' }, preparationInstructions: '10-12 hours fasting required' },
    { name: 'Full Body Checkup Premium',       code: 'PKG002',  category: 'Health Packages', price: 3999, discountedPrice: 2999, sampleType: 'Blood + Urine + Stool', parameters: ['CBC', 'ESR', 'Blood Sugar', 'HbA1c', 'Lipid Profile', 'LFT', 'KFT', 'Thyroid Full', 'Vitamin D', 'Vitamin B12', 'Iron Studies', 'Urine Culture', 'Stool Routine'], turnaroundTime: { value: 1, unit: 'days' }, preparationInstructions: '12 hours fasting, collect early morning samples' },
  ]

  const createdTests = []
  for (const t of testsLab1) {
    const test = await prisma.test.create({
      data: {
        labId:                   lab1.id,
        name:                    t.name,
        code:                    t.code,
        category:                t.category,
        parameters:              t.parameters,
        price:                   t.price,
        discountedPrice:         t.discountedPrice,
        turnaroundTime:          t.turnaroundTime,
        sampleType:              t.sampleType,
        preparationInstructions: t.preparationInstructions,
        isActive:                true,
      },
    })
    createdTests.push(test)
  }

  // Lab 2 tests
  const testsLab2 = [
    { name: 'Aarogyam 1.3',     code: 'THY-A13', category: 'Health Packages', price: 2500, discountedPrice: 1999, sampleType: 'Blood', parameters: ['72 Tests including Full Thyroid, Diabetes, Liver, Kidney'],  turnaroundTime: { value: 1, unit: 'days' } },
    { name: 'TSH Ultra Sensitive', code: 'THY-TSH', category: 'Thyroid',      price: 350,  discountedPrice: null, sampleType: 'Blood', parameters: ['TSH (3rd Generation)'],                                       turnaroundTime: { value: 6, unit: 'hours' } },
    { name: 'Anti-TPO Antibodies', code: 'THY-TPO', category: 'Thyroid',      price: 900,  discountedPrice: 750,  sampleType: 'Blood', parameters: ['Anti-Thyroid Peroxidase Antibodies'],                         turnaroundTime: { value: 8, unit: 'hours' } },
    { name: 'PSA Total',           code: 'PSA001',  category: 'Cancer Markers', price: 850, discountedPrice: 699, sampleType: 'Blood', parameters: ['Prostate Specific Antigen'],                                  turnaroundTime: { value: 6, unit: 'hours' } },
    { name: 'CA 125',              code: 'CA125',   category: 'Cancer Markers', price: 1100,discountedPrice: 899, sampleType: 'Blood', parameters: ['Cancer Antigen 125'],                                         turnaroundTime: { value: 8, unit: 'hours' } },
  ]

  for (const t of testsLab2) {
    await prisma.test.create({
      data: {
        labId:                   lab2.id,
        name:                    t.name,
        code:                    t.code,
        category:                t.category,
        parameters:              t.parameters,
        price:                   t.price,
        discountedPrice:         t.discountedPrice ?? null,
        turnaroundTime:          t.turnaroundTime,
        sampleType:              t.sampleType || 'Blood',
        preparationInstructions: null,
        isActive:                true,
      },
    })
  }

  console.log(`   ✅ Created ${testsLab1.length + testsLab2.length} tests`)

  // ── 11. Coupons ───────────────────────────────────────────────────────────────
  console.log('\n🎟️ Creating coupons...')

  const coupon1 = await prisma.coupon.create({
    data: {
      code:             'MEDLI20',
      name:             'MEDLI 20% Off',
      description:      '20% discount on all bookings (max ₹200)',
      createdBy:        { role: 'super_admin', userId: superAdmin.id, entityId: null, entityName: 'MEDLI Platform' },
      couponType:       'platform',
      discountType:     'percent',
      discountValue:    20,
      maxDiscountAmount:200,
      minOrderAmount:   300,
      validFrom:        new Date(),
      validUntil:       daysFromNow(60),
      totalUsageLimit:  500,
      perUserLimit:     1,
      currentUsageCount:24,
      applicableFor:    'all',
      hospitalIds:      [],
      labIds:           [],
      testIds:          [],
      applicableBookingTypes: ['hospital', 'online', 'lab'],
      isActive:         true,
    },
  })

  const coupon2 = await prisma.coupon.create({
    data: {
      code:             'LABTEST10',
      name:             'Lab 10% Off',
      description:      '10% off on lab tests',
      createdBy:        { role: 'super_admin', userId: superAdmin.id, entityId: null, entityName: 'MEDLI Platform' },
      couponType:       'lab',
      discountType:     'percent',
      discountValue:    10,
      maxDiscountAmount:150,
      minOrderAmount:   200,
      validFrom:        new Date(),
      validUntil:       daysFromNow(30),
      totalUsageLimit:  200,
      perUserLimit:     2,
      currentUsageCount:8,
      applicableFor:    'all',
      hospitalIds:      [],
      labIds:           [lab1.id, lab2.id],
      testIds:          [],
      applicableBookingTypes: ['lab'],
      isActive:         true,
    },
  })

  const coupon3 = await prisma.coupon.create({
    data: {
      code:             'APOLLO100',
      name:             'Apollo ₹100 Off',
      description:      'Flat ₹100 off on Apollo Hospital consultations',
      createdBy:        { role: 'hospital_admin', userId: hospitalAdmin2.id, entityId: hospital2.id, entityName: 'Apollo Hospitals Guntur' },
      couponType:       'hospital',
      discountType:     'fixed',
      discountValue:    100,
      maxDiscountAmount:100,
      minOrderAmount:   400,
      validFrom:        new Date(),
      validUntil:       daysFromNow(45),
      totalUsageLimit:  100,
      perUserLimit:     1,
      currentUsageCount:12,
      applicableFor:    'specific',
      hospitalIds:      [hospital2.id],
      labIds:           [],
      testIds:          [],
      applicableBookingTypes: ['hospital', 'online'],
      isActive:         true,
    },
  })

  const coupon4 = await prisma.coupon.create({
    data: {
      code:             'FIRST500',
      name:             'First Booking ₹50 Off',
      description:      'Welcome discount for first booking',
      createdBy:        { role: 'super_admin', userId: superAdmin.id, entityId: null, entityName: 'MEDLI Platform' },
      couponType:       'platform',
      discountType:     'fixed',
      discountValue:    50,
      maxDiscountAmount:50,
      minOrderAmount:   200,
      validFrom:        new Date(),
      validUntil:       daysFromNow(90),
      totalUsageLimit:  null,
      perUserLimit:     1,
      currentUsageCount:45,
      applicableFor:    'all',
      hospitalIds:      [],
      labIds:           [],
      testIds:          [],
      applicableBookingTypes: ['hospital', 'online', 'lab'],
      isActive:         true,
    },
  })

  console.log('   ✅ Created 4 coupons')

  // ── 12. Bookings ──────────────────────────────────────────────────────────────
  console.log('\n📅 Creating bookings...')

  // Booking 1: Confirmed hospital appointment (future)
  const booking1 = await prisma.booking.create({
    data: {
      bookingId:          bookingId(),
      userId:             patient1.id,
      type:               'hospital',
      hospitalId:         hospital1.id,
      doctorId:           doctor1.id,
      startTime:          hoursFromNow(48),
      endTime:            hoursFromNow(48.17),
      timezone:           'Asia/Kolkata',
      status:             'confirmed',
      paymentStatus:      'paid',
      baseFee:            500,
      couponCode:         null,
      couponDiscount:     0,
      discountedFee:      500,
      platformFeePercent: 10,
      platformFee:        50,
      gstPercent:         18,
      gst:                9,
      subtotal:           559,
      adminCouponDiscount:0,
      totalAmount:        559,
      hdfcOrderId:        'MEDLI1000001',
      hdfcTrackingId:     'TRK10000001',
    },
  })

  // Booking 2: Online consultation (confirmed, near-future for JOIN MEET demo)
  const booking2 = await prisma.booking.create({
    data: {
      bookingId:          bookingId(),
      userId:             patient2.id,
      type:               'online',
      hospitalId:         hospital2.id,
      doctorId:           doctor3.id,
      meetLink:           'https://meet.google.com/abc-defg-hij',
      calendarEventId:    'cal_event_001',
      startTime:          hoursFromNow(0.2), // 12 minutes from now
      endTime:            hoursFromNow(0.7),
      timezone:           'Asia/Kolkata',
      status:             'confirmed',
      paymentStatus:      'paid',
      baseFee:            1000,
      couponCode:         'APOLLO100',
      couponType:         'hospital',
      couponDiscount:     100,
      discountedFee:      900,
      platformFeePercent: 10,
      platformFee:        90,
      gstPercent:         18,
      gst:                16.2,
      subtotal:           1006.2,
      adminCouponDiscount:0,
      totalAmount:        1006.2,
      hdfcOrderId:        'MEDLI1000002',
      hdfcTrackingId:     'TRK10000002',
    },
  })

  // Booking 3: Lab booking (sample collected)
  const booking3 = await prisma.booking.create({
    data: {
      bookingId:          bookingId(),
      userId:             patient1.id,
      type:               'lab',
      labId:              lab1.id,
      testIds:            [createdTests[0].id, createdTests[3].id],
      collectionType:     'home',
      collectionAddress: {
        line1:   '12-3-456, Arundelpet',
        city:    'Guntur',
        state:   'Andhra Pradesh',
        pinCode: '522002',
      },
      startTime:          hoursFromNow(-5),
      endTime:            hoursFromNow(-4),
      timezone:           'Asia/Kolkata',
      status:             'confirmed',
      paymentStatus:      'paid',
      labStatus:          'sample_collected',
      baseFee:            259,
      couponCode:         'LABTEST10',
      couponType:         'lab',
      couponDiscount:     25.9,
      discountedFee:      233.1,
      platformFeePercent: 8,
      platformFee:        18.648,
      gstPercent:         18,
      gst:                3.357,
      subtotal:           255.1,
      adminCouponDiscount:0,
      totalAmount:        255.1,
      hdfcOrderId:        'MEDLI1000003',
      hdfcTrackingId:     'TRK10000003',
    },
  })

  // Booking 4: Lab booking (processing)
  const booking4 = await prisma.booking.create({
    data: {
      bookingId:          bookingId(),
      userId:             patient3.id,
      type:               'lab',
      labId:              lab1.id,
      testIds:            [createdTests[6].id],
      collectionType:     'walk_in',
      startTime:          hoursFromNow(-8),
      endTime:            hoursFromNow(-7.5),
      timezone:           'Asia/Kolkata',
      status:             'confirmed',
      paymentStatus:      'paid',
      labStatus:          'processing',
      baseFee:            499,
      couponDiscount:     0,
      discountedFee:      499,
      platformFeePercent: 8,
      platformFee:        39.92,
      gstPercent:         18,
      gst:                7.186,
      subtotal:           546.1,
      adminCouponDiscount:0,
      totalAmount:        546.1,
      hdfcOrderId:        'MEDLI1000004',
      hdfcTrackingId:     'TRK10000004',
    },
  })

  // Booking 5: Lab booking (report ready)
  const booking5 = await prisma.booking.create({
    data: {
      bookingId:          bookingId(),
      userId:             patient2.id,
      type:               'lab',
      labId:              lab2.id,
      testIds:            [createdTests[8].id],
      collectionType:     'home',
      startTime:          hoursFromNow(-48),
      endTime:            hoursFromNow(-47.5),
      timezone:           'Asia/Kolkata',
      status:             'completed',
      paymentStatus:      'paid',
      labStatus:          'report_ready',
      reportR2Key:        'reports/dummy-report-key/report-001.pdf',
      isSettled:          true,
      baseFee:            599,
      couponDiscount:     0,
      discountedFee:      599,
      platformFeePercent: 8,
      platformFee:        47.92,
      gstPercent:         18,
      gst:                8.626,
      subtotal:           655.55,
      adminCouponDiscount:0,
      totalAmount:        655.55,
      hdfcOrderId:        'MEDLI1000005',
      hdfcTrackingId:     'TRK10000005',
    },
  })

  // Booking 6: Completed hospital
  const booking6 = await prisma.booking.create({
    data: {
      bookingId:          bookingId(),
      userId:             patient4.id,
      type:               'hospital',
      hospitalId:         hospital2.id,
      doctorId:           doctor4.id,
      startTime:          hoursFromNow(-72),
      endTime:            hoursFromNow(-71.8),
      timezone:           'Asia/Kolkata',
      status:             'completed',
      paymentStatus:      'paid',
      isSettled:          true,
      baseFee:            600,
      couponDiscount:     0,
      discountedFee:      600,
      platformFeePercent: 10,
      platformFee:        60,
      gstPercent:         18,
      gst:                10.8,
      subtotal:           670.8,
      adminCouponDiscount:0,
      totalAmount:        670.8,
      hdfcOrderId:        'MEDLI1000006',
      hdfcTrackingId:     'TRK10000006',
      doctorNotes:        'Patient advised to use SPF 50 sunscreen and avoid direct sun exposure. Follow up in 4 weeks.',
    },
  })

  // Booking 7: Cancelled with refund
  const booking7 = await prisma.booking.create({
    data: {
      bookingId:          bookingId(),
      userId:             patient3.id,
      type:               'hospital',
      hospitalId:         hospital1.id,
      doctorId:           doctor2.id,
      startTime:          hoursFromNow(-24),
      endTime:            hoursFromNow(-23.8),
      timezone:           'Asia/Kolkata',
      status:             'cancelled',
      paymentStatus:      'refunded',
      cancellationReason: 'Patient could not attend due to personal emergency',
      cancelledBy:        patient3.id,
      refundAmount:       202,
      baseFee:            400,
      couponDiscount:     0,
      discountedFee:      400,
      platformFeePercent: 10,
      platformFee:        40,
      gstPercent:         18,
      gst:                7.2,
      subtotal:           447.2,
      adminCouponDiscount:0,
      totalAmount:        447.2,
      hdfcOrderId:        'MEDLI1000007',
      hdfcTrackingId:     'TRK10000007',
    },
  })

  // Booking 8: Pending payment
  const booking8 = await prisma.booking.create({
    data: {
      bookingId:          bookingId(),
      userId:             patient4.id,
      type:               'online',
      hospitalId:         hospital1.id,
      doctorId:           doctor6.id,
      startTime:          hoursFromNow(24),
      endTime:            hoursFromNow(24.17),
      timezone:           'Asia/Kolkata',
      status:             'pending_payment',
      paymentStatus:      'pending',
      baseFee:            300,
      couponCode:         'MEDLI20',
      couponType:         'platform',
      couponDiscount:     0,
      discountedFee:      300,
      platformFeePercent: 10,
      platformFee:        30,
      gstPercent:         18,
      gst:                5.4,
      subtotal:           335.4,
      adminCouponDiscount:60,
      totalAmount:        275.4,
      hdfcOrderId:        'MEDLI1000008',
    },
  })

  // Booking 9: No show
  const booking9 = await prisma.booking.create({
    data: {
      bookingId:          bookingId(),
      userId:             patient1.id,
      type:               'hospital',
      hospitalId:         hospital4.id,
      doctorId:           doctor5.id,
      startTime:          hoursFromNow(-120),
      endTime:            hoursFromNow(-119.8),
      timezone:           'Asia/Kolkata',
      status:             'no_show',
      paymentStatus:      'paid',
      baseFee:            700,
      couponDiscount:     0,
      discountedFee:      700,
      platformFeePercent: 10,
      platformFee:        70,
      gstPercent:         18,
      gst:                12.6,
      subtotal:           782.6,
      adminCouponDiscount:0,
      totalAmount:        782.6,
      hdfcOrderId:        'MEDLI1000009',
      hdfcTrackingId:     'TRK10000009',
    },
  })

  // Booking 10: Future lab booking
  const booking10 = await prisma.booking.create({
    data: {
      bookingId:          bookingId(),
      userId:             patient4.id,
      type:               'lab',
      labId:              lab1.id,
      testIds:            [createdTests[19].id],
      collectionType:     'home',
      collectionAddress:  { line1: '45-6-789, Kothapet', city: 'Guntur', state: 'Andhra Pradesh', pinCode: '522001' },
      startTime:          hoursFromNow(72),
      endTime:            hoursFromNow(72.5),
      timezone:           'Asia/Kolkata',
      status:             'confirmed',
      paymentStatus:      'paid',
      baseFee:            1499,
      couponCode:         'FIRST500',
      couponType:         'platform',
      couponDiscount:     0,
      discountedFee:      1499,
      platformFeePercent: 8,
      platformFee:        119.92,
      gstPercent:         18,
      gst:                21.586,
      subtotal:           1640.5,
      adminCouponDiscount:50,
      totalAmount:        1590.5,
      hdfcOrderId:        'MEDLI1000010',
      hdfcTrackingId:     'TRK10000010',
    },
  })

  console.log('   ✅ Created 10 bookings')

  // ── 13. Payments ──────────────────────────────────────────────────────────────
  console.log('\n💳 Creating payments...')

  const paymentData = [
    { b: booking1, status: 'success', mode: 'NET_BANKING', amount: 559 },
    { b: booking2, status: 'success', mode: 'UPI',         amount: 1006.2 },
    { b: booking3, status: 'success', mode: 'CREDIT_CARD', amount: 255.1 },
    { b: booking4, status: 'success', mode: 'DEBIT_CARD',  amount: 546.1 },
    { b: booking5, status: 'success', mode: 'UPI',         amount: 655.55 },
    { b: booking6, status: 'success', mode: 'NET_BANKING', amount: 670.8 },
    { b: booking7, status: 'refunded',mode: 'UPI',         amount: 447.2 },
    { b: booking9, status: 'success', mode: 'CREDIT_CARD', amount: 782.6 },
    { b: booking10,status: 'success', mode: 'UPI',         amount: 1590.5 },
  ]

  for (const p of paymentData) {
    await prisma.payment.create({
      data: {
        bookingId:       p.b.id,
        userId:          p.b.userId,
        hdfcOrderId:     p.b.hdfcOrderId,
        hdfcTrackingId:  p.b.hdfcTrackingId,
        hdfcBankRefNo:   `BREF${Math.floor(Math.random() * 9999999)}`,
        hdfcPaymentMode: p.mode,
        amount:          p.amount,
        currency:        'INR',
        status:          p.status,
        hdfcCallbackData: {
          order_status: p.status === 'success' ? 'Success' : 'Failure',
          tracking_id:  p.b.hdfcTrackingId,
          payment_mode: p.mode,
        },
        refunds: p.status === 'refunded' ? [{ amount: 202, refundTrackingId: 'RTRK001', utrNumber: 'UTR001234567', reason: 'Booking cancelled', status: 'completed', processedAt: new Date() }] : [],
      },
    })
  }

  console.log('   ✅ Created payments')

  // ── 14. Invoices ──────────────────────────────────────────────────────────────
  console.log('\n🧾 Creating invoices...')

  const invoiceBookings = [
    { b: booking1, entity: 'hospital', entityId: hospital1.id },
    { b: booking2, entity: 'hospital', entityId: hospital2.id },
    { b: booking3, entity: 'lab',      entityId: lab1.id },
    { b: booking5, entity: 'lab',      entityId: lab2.id },
    { b: booking6, entity: 'hospital', entityId: hospital2.id },
    { b: booking10,entity: 'lab',      entityId: lab1.id },
  ]

  for (const inv of invoiceBookings) {
    await prisma.invoice.create({
      data: {
        invoiceNumber:       invoiceNumber(),
        bookingId:           inv.b.id,
        userId:              inv.b.userId,
        entityType:          inv.entity,
        entityId:            inv.entityId,
        items: [{
          description: inv.entity === 'lab' ? 'Lab Tests' : 'Consultation Fee',
          quantity:    1,
          rate:        inv.b.baseFee,
          amount:      inv.b.baseFee,
        }],
        baseFee:             inv.b.baseFee,
        couponCode:          inv.b.couponCode,
        couponDiscount:      inv.b.couponDiscount,
        couponType:          inv.b.couponType,
        discountedFee:       inv.b.discountedFee,
        platformFeePercent:  inv.b.platformFeePercent,
        platformFee:         inv.b.platformFee,
        gstPercent:          inv.b.gstPercent,
        gst:                 inv.b.gst,
        subtotal:            inv.b.subtotal,
        adminCouponDiscount: inv.b.adminCouponDiscount,
        totalAmount:         inv.b.totalAmount,
        gstDetails: {
          medliGstin: '27MEDLI1234Z1',
          hsnCode:    inv.entity === 'lab' ? '998931' : '999311',
          gstRate:    18,
        },
        paymentMethod: 'online',
        paymentMode:   'UPI',
        hdfcTrackingId:inv.b.hdfcTrackingId,
        type:          'invoice',
      },
    })
  }

  console.log('   ✅ Created invoices')

  // ── 15. Settlement ────────────────────────────────────────────────────────────
  console.log('\n💰 Creating settlements...')

  const settlement1 = await prisma.settlement.create({
    data: {
      settlementNumber:    settlementNumber(),
      entityType:          'hospital',
      entityId:            hospital2.id,
      entityName:          'Apollo Hospitals Guntur',
      periodFrom:          daysFromNow(-30),
      periodTo:            daysFromNow(-1),
      totalBookings:       2,
      grossAmount:         1670.8,
      platformFee:         167.08,
      gst:                 30.07,
      couponAbsorbed:      0,
      refundsDeducted:     0,
      netSettlementAmount: 1473.65,
      bankAccountId:       hospitalBank2.id,
      beneficiaryName:     'Apollo Hospitals Guntur Pvt Ltd',
      beneficiaryAccount:  'ENC_9876543210987654',
      beneficiaryIFSC:     'HDFC0004567',
      bankName:            'HDFC Bank',
      transferMode:        'IMPS',
      hdfcTransactionId:   'HDFC_TXN_001234',
      utrNumber:           'UTR2024001234567',
      transferredAt:       new Date(),
      status:              'completed',
      initiatedBy:         superAdmin.id,
      notes:               'Monthly settlement for Apollo Guntur',
      bookingIds:          [booking6.id],
    },
  })

  const settlement2 = await prisma.settlement.create({
    data: {
      settlementNumber:    settlementNumber(),
      entityType:          'lab',
      entityId:            lab1.id,
      entityName:          'Sri Diagnostics Centre',
      periodFrom:          daysFromNow(-15),
      periodTo:            daysFromNow(-1),
      totalBookings:       1,
      grossAmount:         599,
      platformFee:         47.92,
      gst:                 8.626,
      couponAbsorbed:      0,
      refundsDeducted:     0,
      netSettlementAmount: 542.45,
      bankAccountId:       labBank1.id,
      beneficiaryName:     'Sri Diagnostics Centre',
      beneficiaryAccount:  'ENC_5544332211009988',
      beneficiaryIFSC:     'ICIC0002345',
      bankName:            'ICICI Bank',
      transferMode:        'IMPS',
      hdfcTransactionId:   'HDFC_TXN_005678',
      utrNumber:           'UTR2024005678901',
      transferredAt:       new Date(),
      status:              'completed',
      initiatedBy:         superAdmin.id,
      notes:               'Lab settlement for Sri Diagnostics',
      bookingIds:          [booking5.id],
    },
  })

  const settlement3 = await prisma.settlement.create({
    data: {
      settlementNumber:    settlementNumber(),
      entityType:          'hospital',
      entityId:            hospital1.id,
      entityName:          'Guntur Government General Hospital',
      periodFrom:          daysFromNow(-7),
      periodTo:            new Date(),
      totalBookings:       3,
      grossAmount:         1200,
      platformFee:         120,
      gst:                 21.6,
      couponAbsorbed:      0,
      refundsDeducted:     202,
      netSettlementAmount: 856.4,
      bankAccountId:       hospitalBank1.id,
      status:              'pending',
      initiatedBy:         superAdmin.id,
      bookingIds:          [booking1.id],
    },
  })

  console.log('   ✅ Created 3 settlements')

  // ── 16. Refund ────────────────────────────────────────────────────────────────
  console.log('\n↩️ Creating refunds...')

  await prisma.refund.create({
    data: {
      refundNumber:       refundNumber(),
      bookingId:          booking7.id,
      userId:             patient3.id,
      bookingAmount:      447.2,
      refundPercent:      50,
      refundAmount:       202,
      reason:             'Patient cancelled due to personal emergency',
      cancelledBy:        patient3.id,
      refundMethod:       'original_source',
      hdfcTransactionId:  'REFUND_TXN_001',
      utrNumber:          'RUTR2024001122',
      status:             'completed',
      processedAt:        new Date(),
      initiatedBy:        superAdmin.id,
    },
  })

  console.log('   ✅ Created refund')

  // ── 17. Ledger ────────────────────────────────────────────────────────────────
  console.log('\n📒 Creating ledger entries...')

  const ledgerEntries = [
    { entityType: 'hospital', entityId: hospital2.id, type: 'credit', category: 'booking_payment', amount: 670.8,    description: 'Booking payment received - Dermatology', referenceType: 'booking', referenceId: booking6.id },
    { entityType: 'hospital', entityId: hospital2.id, type: 'debit',  category: 'platform_fee',    amount: 60,       description: 'Platform fee deducted',                referenceType: 'booking', referenceId: booking6.id },
    { entityType: 'hospital', entityId: hospital2.id, type: 'debit',  category: 'settlement',      amount: 1473.65,  description: 'Settlement processed',                 referenceType: 'settlement', referenceId: settlement1.id },
    { entityType: 'lab',      entityId: lab1.id,       type: 'credit', category: 'booking_payment', amount: 655.55,   description: 'Lab booking payment received',        referenceType: 'booking', referenceId: booking5.id },
    { entityType: 'lab',      entityId: lab1.id,       type: 'debit',  category: 'settlement',      amount: 542.45,   description: 'Lab settlement processed',             referenceType: 'settlement', referenceId: settlement2.id },
    { entityType: 'user',     entityId: patient3.id,   type: 'debit',  category: 'refund',          amount: 202,      description: 'Refund for cancelled booking',         referenceType: 'booking', referenceId: booking7.id },
  ]

  for (const entry of ledgerEntries) {
    await prisma.ledger.create({
      data: {
        entityType:    entry.entityType,
        entityId:      entry.entityId,
        type:          entry.type,
        category:      entry.category,
        amount:        entry.amount,
        currency:      'INR',
        description:   entry.description,
        referenceType: entry.referenceType,
        referenceId:   entry.referenceId,
        runningBalance:0,
      },
    })
  }

  console.log('   ✅ Created ledger entries')

  // ── 18. Coupon Usages ─────────────────────────────────────────────────────────
  console.log('\n🎫 Creating coupon usages...')

  await prisma.couponUsage.create({
    data: {
      couponId:      coupon3.id,
      couponCode:    'APOLLO100',
      userId:        patient2.id,
      bookingId:     booking2.id,
      discountAmount:100,
      appliedOn:     'online',
    },
  })

  await prisma.couponUsage.create({
    data: {
      couponId:      coupon2.id,
      couponCode:    'LABTEST10',
      userId:        patient1.id,
      bookingId:     booking3.id,
      discountAmount:25.9,
      appliedOn:     'lab',
    },
  })

  console.log('   ✅ Created coupon usages')

  // ── 19. Notification Logs ─────────────────────────────────────────────────────
  console.log('\n🔔 Creating notification logs...')

  const notifData = [
    { userId: patient1.id, channel: 'sms',   template: 'booking_confirmed', status: 'delivered' },
    { userId: patient1.id, channel: 'email', template: 'booking_confirmed', status: 'delivered' },
    { userId: patient2.id, channel: 'sms',   template: 'booking_confirmed', status: 'delivered' },
    { userId: patient2.id, channel: 'email', template: 'booking_confirmed', status: 'delivered' },
    { userId: patient2.id, channel: 'push',  template: 'lab_report_ready',  status: 'delivered' },
    { userId: patient3.id, channel: 'sms',   template: 'booking_cancelled', status: 'delivered' },
    { userId: patient3.id, channel: 'email', template: 'refund_processed',  status: 'sent' },
    { userId: patient4.id, channel: 'sms',   template: 'booking_confirmed', status: 'delivered' },
    { userId: patient4.id, channel: 'email', template: 'booking_confirmed', status: 'delivered' },
  ]

  for (const n of notifData) {
    await prisma.notificationLog.create({
      data: {
        userId:           n.userId,
        channel:          n.channel,
        template:         n.template,
        variables:        { bookingId: 'BK-2024-XXXXX' },
        status:           n.status,
        retryCount:       0,
        providerResponse: { messageId: `MSG_${Math.floor(Math.random() * 999999)}` },
      },
    })
  }

  console.log('   ✅ Created notification logs')

  // ── 20. Audit Logs ────────────────────────────────────────────────────────────
  console.log('\n📋 Creating audit logs...')

  const auditData = [
    { actorId: superAdmin.id, actorRole: 'super_admin', action: 'hospital_approved',     targetType: 'hospital', targetId: hospital1.id, details: { hospitalName: hospital1.name } },
    { actorId: superAdmin.id, actorRole: 'super_admin', action: 'hospital_approved',     targetType: 'hospital', targetId: hospital2.id, details: { hospitalName: hospital2.name } },
    { actorId: superAdmin.id, actorRole: 'super_admin', action: 'lab_approved',          targetType: 'lab',      targetId: lab1.id,      details: { labName: lab1.name } },
    { actorId: superAdmin.id, actorRole: 'super_admin', action: 'lab_approved',          targetType: 'lab',      targetId: lab2.id,      details: { labName: lab2.name } },
    { actorId: superAdmin.id, actorRole: 'super_admin', action: 'doctor_verified',       targetType: 'doctor',   targetId: doctor1.id,   details: { doctorName: doctor1.name } },
    { actorId: superAdmin.id, actorRole: 'super_admin', action: 'doctor_verified',       targetType: 'doctor',   targetId: doctor2.id,   details: { doctorName: doctor2.name } },
    { actorId: superAdmin.id, actorRole: 'super_admin', action: 'settlement_processed',  targetType: 'hospital', targetId: hospital2.id, details: { amount: 1473.65, settlementId: settlement1.id } },
    { actorId: superAdmin.id, actorRole: 'super_admin', action: 'region_manager_assigned', targetType: 'region', targetId: region.id,    details: { managerId: regionalManager.id } },
    { actorId: superAdmin.id, actorRole: 'super_admin', action: 'user_blocked',          targetType: 'user',     targetId: patient3.id,  details: { reason: 'Suspicious activity' } },
    { actorId: superAdmin.id, actorRole: 'super_admin', action: 'cache_cleared',         targetType: null,       targetId: null,         details: { pattern: 'slots:*' } },
  ]

  for (const a of auditData) {
    await prisma.auditLog.create({
      data: {
        actorId:    a.actorId,
        actorRole:  a.actorRole,
        action:     a.action,
        targetType: a.targetType || null,
        targetId:   a.targetId   || null,
        details:    a.details,
        ipAddress:  '192.168.1.10',
      },
    })
  }

  console.log('   ✅ Created audit logs')

  // ── 21. Platform Settings ─────────────────────────────────────────────────────
  console.log('\n⚙️ Creating platform settings...')

  const settings = [
    { key: 'branding',             category: 'general',  value: { platformName: 'MEDLI', supportEmail: 'support@medli.in', supportPhone: '+91 9000000000', tagline: 'Healthcare at your fingertips' } },
    { key: 'slot_rules',           category: 'booking',  value: { defaultSlotDuration: 10, maxReschedules: 2, bookingLeadTime: 60, maxFutureBookingDays: 30 } },
    { key: 'cancellation_policy',  category: 'booking',  value: { above24h: 100, '12to24h': 50, '4to12h': 25, below4h: 0 } },
    { key: 'gst_config',           category: 'finance',  value: { gstin: '27MEDLI1234Z1', gstRate: 18, hsnConsultation: '999311', hsnLab: '998931' } },
    { key: 'platform_fee_defaults',category: 'finance',  value: { hospital: 10, lab: 8, online: 10 } },
    { key: 'feature_flags',        category: 'features', value: { homeCollection: true, onlineConsultation: true, labReports: true, walletEnabled: false, referralEnabled: false } },
  ]

  for (const s of settings) {
    await prisma.platformSetting.create({
      data: {
        key:       s.key,
        value:     s.value,
        category:  s.category,
        updatedBy: superAdmin.id,
      },
    })
  }

  console.log('   ✅ Created platform settings')

  // ── 22. Permissions ───────────────────────────────────────────────────────────
  console.log('\n🔐 Creating permissions...')

  const permissions = [
    { roleId: 'super_admin',      module: 'hospitals',    actions: ['read', 'write', 'delete', 'approve'] },
    { roleId: 'super_admin',      module: 'labs',         actions: ['read', 'write', 'delete', 'approve'] },
    { roleId: 'super_admin',      module: 'doctors',      actions: ['read', 'write', 'delete', 'verify'] },
    { roleId: 'super_admin',      module: 'users',        actions: ['read', 'write', 'block'] },
    { roleId: 'super_admin',      module: 'bookings',     actions: ['read', 'write', 'cancel'] },
    { roleId: 'super_admin',      module: 'settlements',  actions: ['read', 'write', 'process'] },
    { roleId: 'super_admin',      module: 'refunds',      actions: ['read', 'write', 'process'] },
    { roleId: 'super_admin',      module: 'analytics',    actions: ['read'] },
    { roleId: 'hospital_admin',   module: 'doctors',      actions: ['read', 'write'] },
    { roleId: 'hospital_admin',   module: 'bookings',     actions: ['read', 'update_status'] },
    { roleId: 'hospital_admin',   module: 'coupons',      actions: ['read', 'write'] },
    { roleId: 'hospital_admin',   module: 'settlements',  actions: ['read'] },
    { roleId: 'lab_admin',        module: 'tests',        actions: ['read', 'write', 'delete'] },
    { roleId: 'lab_admin',        module: 'bookings',     actions: ['read', 'update_lab_status'] },
    { roleId: 'lab_admin',        module: 'reports',      actions: ['upload'] },
    { roleId: 'lab_admin',        module: 'settlements',  actions: ['read'] },
    { roleId: 'doctor',           module: 'bookings',     actions: ['read', 'update_status', 'add_notes'] },
    { roleId: 'doctor',           module: 'availability', actions: ['read', 'write'] },
    { roleId: 'regional_manager', module: 'hospitals',    actions: ['read'] },
    { roleId: 'regional_manager', module: 'labs',         actions: ['read'] },
    { roleId: 'regional_manager', module: 'bookings',     actions: ['read'] },
    { roleId: 'regional_manager', module: 'analytics',    actions: ['read'] },
    { roleId: 'user',             module: 'bookings',     actions: ['read', 'create', 'cancel', 'reschedule'] },
    { roleId: 'user',             module: 'invoices',     actions: ['read', 'download'] },
    { roleId: 'user',             module: 'reports',      actions: ['download'] },
    { roleId: 'user',             module: 'profile',      actions: ['read', 'write'] },
  ]

  for (const p of permissions) {
    await prisma.permission.create({ data: p })
  }

  console.log('   ✅ Created permissions')

  // ── 23. User Bank Account ─────────────────────────────────────────────────────
  console.log('\n🏦 Adding user bank account...')

  await prisma.user.update({
    where: { id: patient1.id },
    data: {
      bankAccount: {
        accountHolderName: 'Srinivas Murthy',
        accountNumber:     'ENC_patient1_account',
        ifscCode:          'SBIN0009876',
        bankName:          'State Bank of India',
        upiId:             'srinivas@upi',
        isVerified:        true,
      },
    },
  })

  console.log('   ✅ User bank account added')

  // ── 24. Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60))
  console.log('✅ MEDLI Seed Complete — Guntur, Andhra Pradesh')
  console.log('═'.repeat(60))
  console.log('\n📊 Summary:')
  console.log(`   👤 Users:        14  (1 super_admin + 2 hospital + 2 lab + 4 doctors + 4 patients + 1 regional)`)
  console.log(`   🏥 Hospitals:    4   (2 approved, 1 pending, 1 approved-no-admin)`)
  console.log(`   🧪 Labs:         3   (2 approved, 1 pending)`)
  console.log(`   👨‍⚕️ Doctors:      6   (5 verified, 1 pending)`)
  console.log(`   🔬 Tests:        ${testsLab1.length + testsLab2.length}  (across 2 labs)`)
  console.log(`   📅 Bookings:     10  (all states + types)`)
  console.log(`   💳 Payments:     9`)
  console.log(`   🧾 Invoices:     6`)
  console.log(`   💰 Settlements:  3   (2 completed, 1 pending)`)
  console.log(`   ↩️  Refunds:      1   (completed)`)
  console.log(`   🎟️  Coupons:      4   (hospital + lab + platform)`)
  console.log(`   📒 Ledger:       ${ledgerEntries.length}   entries`)
  console.log(`   🔐 Permissions:  ${permissions.length}  role-module pairs`)
  console.log(`   ⚙️  Settings:     ${settings.length}   platform settings`)
  console.log('\n🔑 Login Credentials (all passwords: Password@123):')
  console.log('   super_admin       → admin@medli.in')
  console.log('   regional_manager  → ravi.regional@medli.in')
  console.log('   hospital_admin 1  → admin@gunturhospital.in')
  console.log('   hospital_admin 2  → admin@apolloguntur.in')
  console.log('   lab_admin 1       → admin@sridiagnostics.in')
  console.log('   lab_admin 2       → admin@thyrocareguntur.in')
  console.log('   doctor 1          → dr.venkata@medli.in') 
  console.log('   doctor 2          → dr.anitha@medli.in')
  console.log('   patient 1         → srinivas@gmail.com')
  console.log('   patient 2         → kavitha@gmail.com')
  console.log('\n📍 All locations: Guntur, Andhra Pradesh 522001')
  console.log('═'.repeat(60))
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })