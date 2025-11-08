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
      role: 'admin',
      status: 'active',
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
      role: 'doctor',
      status: 'active',
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
      role: 'doctor',
      status: 'active',
      specialty: 'Retinal Specialist',
      emailVerified: true,
    },
  });
  console.log('✅ Created doctor users');

  // Create Analyst User
  const analyst1 = await prisma.user.upsert({
    where: { email: 'analyst1@visionclinic.com' },
    update: {},
    create: {
      email: 'analyst1@visionclinic.com',
      password: hashedPassword,
      firstName: 'Ahmed',
      lastName: 'Hassan',
      role: 'analyst',
      status: 'active',
      emailVerified: true,
    },
  });
  console.log('✅ Created analyst user');

  // Create Pharmacy User
  const pharmacy1 = await prisma.user.upsert({
    where: { email: 'pharmacy@visionclinic.com' },
    update: {},
    create: {
      email: 'pharmacy@visionclinic.com',
      password: hashedPassword,
      firstName: 'Main',
      lastName: 'Pharmacy',
      role: 'pharmacy',
      status: 'active',
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
      role: 'patient',
      status: 'active',
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
      role: 'patient',
      status: 'active',
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
      role: 'patient',
      status: 'active',
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
      allergies: JSON.stringify(['Penicillin', 'Dust']),
      chronicConditions: JSON.stringify(['Hypertension', 'Diabetes Type 2']),
      medications: JSON.stringify(['Metformin 500mg', 'Lisinopril 10mg']),
      emergencyContacts: JSON.stringify([
        { name: 'Sara Ali', relationship: 'Wife', phone: '+1234567893' },
      ]),
    },
  });

  await prisma.patient.upsert({
    where: { userId: patient2User.id },
    update: {},
    create: {
      userId: patient2User.id,
      allergies: JSON.stringify([]),
      chronicConditions: JSON.stringify([]),
      medications: JSON.stringify([]),
      emergencyContacts: JSON.stringify([
        { name: 'Hassan Ibrahim', relationship: 'Father', phone: '+1234567894' },
      ]),
    },
  });

  await prisma.patient.upsert({
    where: { userId: patient3User.id },
    update: {},
    create: {
      userId: patient3User.id,
      allergies: JSON.stringify(['Sulfa drugs']),
      chronicConditions: JSON.stringify(['Glaucoma']),
      medications: JSON.stringify(['Timolol eye drops']),
      emergencyContacts: JSON.stringify([
        { name: 'Layla Khalil', relationship: 'Daughter', phone: '+1234567895' },
      ]),
    },
  });
  console.log('✅ Created patient records');

  // Create Appointments
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.appointment.create({
    data: {
      patientId: patient1User.id,
      doctorId: doctor1.id,
      appointmentDate: tomorrow,
      appointmentTime: '10:00 AM',
      reason: 'Routine eye examination',
      status: 'confirmed',
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
      status: 'pending',
    },
  });
  console.log('✅ Created appointments');

  // Create Eye Tests
  await prisma.eyeTest.create({
    data: {
      patientId: patient1User.id,
      analystId: analyst1.id,
      doctorId: doctor1.id,
      testType: 'Comprehensive Eye Exam',
      visualAcuityRight: '20/40',
      visualAcuityLeft: '20/30',
      intraocularpressureRight: 18.5,
      intraocularpressureLeft: 17.2,
      colorVision: 'Normal',
      fieldOfVision: 'Full',
      refraction: JSON.stringify({
        right: { sphere: -2.25, cylinder: -0.5, axis: 180 },
        left: { sphere: -2.0, cylinder: -0.75, axis: 175 },
      }),
      analystNotes: 'Mild myopia detected',
      status: 'completed',
    },
  });
  console.log('✅ Created eye tests');

  // Create Prescriptions
  await prisma.prescription.create({
    data: {
      patientId: patient1User.id,
      doctorId: doctor1.id,
      medications: JSON.stringify([
        {
          name: 'Artificial Tears',
          dosage: '1 drop',
          frequency: '4 times daily',
          duration: '30 days',
        },
      ]),
      glasses: JSON.stringify({
        right: { sphere: -2.25, cylinder: -0.5, axis: 180 },
        left: { sphere: -2.0, cylinder: -0.75, axis: 175 },
        type: 'Progressive lenses',
      }),
      instructions: 'Use artificial tears regularly. Wear glasses for all activities.',
      status: 'approved',
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('✅ Created prescriptions');

  // Create Cases
  await prisma.case.create({
    data: {
      patientId: patient1User.id,
      doctorId: doctor1.id,
      title: 'Progressive Myopia',
      description: 'Patient experiencing worsening near-sightedness',
      diagnosis: 'Myopia progression',
      symptoms: JSON.stringify(['Blurry distance vision', 'Eye strain', 'Headaches']),
      status: 'in_progress',
      priority: 'medium',
      notes: 'Consider orthokeratology for myopia control',
    },
  });
  console.log('✅ Created cases');

  // Create Notifications
  await prisma.notification.create({
    data: {
      userId: patient1User.id,
      title: 'Appointment Reminder',
      message: 'Your appointment with Dr. Sarah Johnson is tomorrow at 10:00 AM',
      type: 'appointment',
      priority: 'high',
    },
  });

  await prisma.notification.create({
    data: {
      userId: doctor1.id,
      title: 'New Test Results',
      message: 'Eye test results for Ahmed Ali are ready for review',
      type: 'test_result',
      priority: 'medium',
    },
  });
  console.log('✅ Created notifications');

  // Create System Settings
  await prisma.systemSettings.upsert({
    where: { key: 'clinic_name' },
    update: {},
    create: {
      key: 'clinic_name',
      value: JSON.stringify('Vision Smart Clinic'),
      category: 'general',
    },
  });

  await prisma.systemSettings.upsert({
    where: { key: 'offline_mode' },
    update: {},
    create: {
      key: 'offline_mode',
      value: JSON.stringify(true),
      category: 'system',
    },
  });
  console.log('✅ Created system settings');

  console.log('\n🎉 Database seeding completed successfully!\n');
  console.log('📝 Test Credentials:');
  console.log('Admin:    admin@visionclinic.com / password123');
  console.log('Doctor:   dr.sarah@visionclinic.com / password123');
  console.log('Analyst:  analyst1@visionclinic.com / password123');
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


