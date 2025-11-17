import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for MySQL...');

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@visionclinic.com' },
    update: {},
    create: {
      email: 'admin@visionclinic.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  console.log('✅ Created admin user');

  // Create Doctor Users
  const doctor1 = await prisma.user.upsert({
    where: { email: 'dr.sarah@visionclinic.com' },
    update: {},
    create: {
      email: 'dr.sarah@visionclinic.com',
      password: hashedPassword,
      firstName: 'Dr. Sarah',
      lastName: 'Johnson',
      role: 'DOCTOR',
      status: 'ACTIVE',
      specialty: 'Ophthalmology',
      emailVerified: true,
    },
  });

  const doctor2 = await prisma.user.upsert({
    where: { email: 'dr.noor@visionclinic.com' },
    update: {},
    create: {
      email: 'dr.noor@visionclinic.com',
      password: hashedPassword,
      firstName: 'Dr. Noor',
      lastName: 'Al-Rahman',
      role: 'DOCTOR',
      status: 'ACTIVE',
      specialty: 'Retinal Specialist',
      emailVerified: true,
    },
  });
  console.log('✅ Created doctor users');

  // Create Optometrist User
  const optometrist1 = await prisma.user.upsert({
    where: { email: 'optometrist1@visionclinic.com' },
    update: {},
    create: {
      email: 'optometrist1@visionclinic.com',
      password: hashedPassword,
      firstName: 'Ahmed',
      lastName: 'Hassan',
      role: 'OPTOMETRIST',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  console.log('✅ Created optometrist user');

  // Create Pharmacy User
  const pharmacy1 = await prisma.user.upsert({
    where: { email: 'pharmacy@visionclinic.com' },
    update: {},
    create: {
      email: 'pharmacy@visionclinic.com',
      password: hashedPassword,
      firstName: 'Main',
      lastName: 'Pharmacy',
      role: 'PHARMACY',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  console.log('✅ Created pharmacy user');

  // Create Patient Users
  const patient1User = await prisma.user.upsert({
    where: { email: 'ahmed.ali@email.com' },
    update: {},
    create: {
      email: 'ahmed.ali@email.com',
      password: hashedPassword,
      firstName: 'Ahmed',
      lastName: 'Ali',
      role: 'PATIENT',
      status: 'ACTIVE',
      phone: '+1234567890',
      dateOfBirth: new Date('1985-05-15'),
      address: '123 Main St, City',
      emailVerified: true,
    },
  });

  const patient2User = await prisma.user.upsert({
    where: { email: 'fatima.hassan@email.com' },
    update: {},
    create: {
      email: 'fatima.hassan@email.com',
      password: hashedPassword,
      firstName: 'Fatima',
      lastName: 'Hassan',
      role: 'PATIENT',
      status: 'ACTIVE',
      phone: '+1234567891',
      dateOfBirth: new Date('1990-08-20'),
      address: '456 Oak Ave, City',
      emailVerified: true,
    },
  });

  const patient3User = await prisma.user.upsert({
    where: { email: 'omar.khalil@email.com' },
    update: {},
    create: {
      email: 'omar.khalil@email.com',
      password: hashedPassword,
      firstName: 'Omar',
      lastName: 'Khalil',
      role: 'PATIENT',
      status: 'ACTIVE',
      phone: '+1234567892',
      dateOfBirth: new Date('1978-03-10'),
      address: '789 Pine Rd, City',
      emailVerified: true,
    },
  });
  console.log('✅ Created patient users');

  // Create Patient Records
  await prisma.patient.upsert({
    where: { userId: patient1User.id },
    update: {},
    create: {
      userId: patient1User.id,
      allergies: ['Penicillin', 'Dust'],
      chronicConditions: ['Hypertension', 'Diabetes Type 2'],
      medications: ['Metformin 500mg', 'Lisinopril 10mg'],
      emergencyContacts: [
        { name: 'Sara Ali', relationship: 'Wife', phone: '+1234567893' },
      ],
    },
  });

  await prisma.patient.upsert({
    where: { userId: patient2User.id },
    update: {},
    create: {
      userId: patient2User.id,
      allergies: [],
      chronicConditions: [],
      medications: [],
      emergencyContacts: [
        { name: 'Hassan Ibrahim', relationship: 'Father', phone: '+1234567894' },
      ],
    },
  });

  await prisma.patient.upsert({
    where: { userId: patient3User.id },
    update: {},
    create: {
      userId: patient3User.id,
      allergies: ['Sulfa drugs'],
      chronicConditions: ['Glaucoma'],
      medications: ['Timolol eye drops'],
      emergencyContacts: [
        { name: 'Layla Khalil', relationship: 'Daughter', phone: '+1234567895' },
      ],
    },
  });
  console.log('✅ Created patient records');

  // Create Appointments
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  // Completed appointments (for billing/receipt testing)
  await prisma.appointment.create({
    data: {
      patientId: patient1User.id,
      doctorId: doctor1.id,
      appointmentDate: lastWeek,
      appointmentTime: '9:00 AM',
      reason: 'Eye examination',
      status: 'COMPLETED',
      notes: 'Completed eye examination. Prescribed glasses.',
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: patient1User.id,
      doctorId: doctor2.id,
      appointmentDate: yesterday,
      appointmentTime: '2:00 PM',
      reason: 'Follow-up consultation',
      status: 'COMPLETED',
      notes: 'Follow-up completed. Patient doing well.',
    },
  });

  // Future appointments
  await prisma.appointment.create({
    data: {
      patientId: patient1User.id,
      doctorId: doctor1.id,
      appointmentDate: tomorrow,
      appointmentTime: '10:00 AM',
      reason: 'Routine eye examination',
      status: 'CONFIRMED',
      notes: 'Patient reports blurry vision',
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: patient2User.id,
      doctorId: doctor2.id,
      appointmentDate: tomorrow,
      appointmentTime: '2:30 PM',
      reason: 'Follow-up consultation',
      status: 'PENDING',
    },
  });
  console.log('✅ Created appointments (including completed ones for billing)');

  // Create Eye Tests
  await prisma.eyeTest.create({
    data: {
      patientId: patient1User.id,
      optometristId: optometrist1.id,
      doctorId: doctor1.id,
      visualAcuityRight: '20/40',
      visualAcuityLeft: '20/30',
      refractionRight: { sphere: -2.25, cylinder: -0.5, axis: 180 },
      refractionLeft: { sphere: -2.0, cylinder: -0.75, axis: 175 },
      retinaImages: [],
      optometristNotes: 'Mild myopia detected',
      status: 'COMPLETED',
    },
  });
  console.log('✅ Created eye tests');

  // Create Prescriptions
  // Completed prescription (generates paid invoice)
  await prisma.prescription.create({
    data: {
      patientId: patient1User.id,
      doctorId: doctor1.id,
      medications: [
        {
          name: 'Artificial Tears',
          dosage: '1 drop',
          frequency: '4 times daily',
          duration: '30 days',
        },
      ],
      glasses: {
        right: { sphere: -2.25, cylinder: -0.5, axis: 180 },
        left: { sphere: -2.0, cylinder: -0.75, axis: 175 },
        type: 'Progressive lenses',
      },
      notes: 'Use artificial tears regularly. Wear glasses for all activities.',
      status: 'COMPLETED',
    },
  });

  // Filled prescription (generates pending invoice)
  await prisma.prescription.create({
    data: {
      patientId: patient1User.id,
      doctorId: doctor2.id,
      medications: [
        {
          name: 'Eye Drops',
          dosage: '2 drops',
          frequency: '3 times daily',
          duration: '14 days',
        },
      ],
      notes: 'For dry eye treatment',
      status: 'FILLED',
    },
  });
  console.log('✅ Created prescriptions (completed and filled for billing)');

  // Create Cases
  await prisma.case.create({
    data: {
      patientId: patient1User.id,
      assignedDoctors: {
        connect: { id: doctor1.id },
      },
      diagnosis: 'Myopia progression',
      timeline: [],
      notes: 'Consider orthokeratology for myopia control',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
    },
  });
  console.log('✅ Created cases');

  // Create Notifications
  await prisma.notification.create({
    data: {
      userId: patient1User.id,
      title: 'Appointment Reminder',
      message: 'Your appointment with Dr. Sarah Johnson is tomorrow at 10:00 AM',
      type: 'FOLLOW_UP_REMINDER',
      priority: 'HIGH',
    },
  });

  await prisma.notification.create({
    data: {
      userId: doctor1.id,
      title: 'New Test Results',
      message: 'Eye test results for Ahmed Ali are ready for review',
      type: 'ABNORMAL_FINDING',
      priority: 'MEDIUM',
    },
  });
  console.log('✅ Created notifications');

  // Create System Settings
  await prisma.systemSettings.upsert({
    where: { settingsKey: 'clinic_name' },
    update: {},
    create: {
      settingsKey: 'clinic_name',
      currency: 'USD',
      language: 'en',
      theme: 'light',
      otherSettings: { value: 'Vision Smart Clinic' },
    },
  });

  await prisma.systemSettings.upsert({
    where: { settingsKey: 'offline_mode' },
    update: {},
    create: {
      settingsKey: 'offline_mode',
      currency: 'USD',
      language: 'en',
      theme: 'light',
      otherSettings: { enabled: true },
    },
  });
  console.log('✅ Created system settings');

  console.log('\n🎉 Database seeding completed successfully!\n');
  console.log('📝 Test Credentials:');
  console.log('Admin:    admin@visionclinic.com / password123');
  console.log('Doctor:   dr.sarah@visionclinic.com / password123');
  console.log('Optometrist:  optometrist1@visionclinic.com / password123');
  console.log('Pharmacy: pharmacy@visionclinic.com / password123');
  console.log('Patient:  ahmed.ali@email.com / password123');
  console.log('\n🌐 Access at: http://localhost:3000');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


