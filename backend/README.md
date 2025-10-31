# Vision Clinic Backend

Smart Vision Clinic Backend API built with NestJS and MongoDB.

## Setup

1. Install dependencies:
```bash
npm install
```

2. MongoDB is already installed and running on your system. Verify connection:
```bash
# Run the setup script to verify MongoDB connection
bash setup-db.sh
```

3. The `.env` file has been created with MongoDB connection settings:
```env
MONGODB_URI=mongodb://localhost:27017/vision-clinic
JWT_SECRET=vision-clinic-secret-key-change-this-in-production-2024
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

4. Start the server:
```bash
npm run start:dev
```

## API Endpoints

### Authentication
- POST `/auth/register` - Register new user
- POST `/auth/login` - Login (use email, phone, or national ID as identifier)
- GET `/auth/profile` - Get current user profile

### Patients
- GET `/patients/profile` - Get patient profile
- PUT `/patients/profile` - Update patient profile
- GET `/patients/medical-history` - Get medical history

### Appointments
- POST `/appointments` - Create appointment
- GET `/appointments/my-appointments` - Get user appointments
- GET `/appointments/upcoming` - Get upcoming appointments

### Eye Tests
- POST `/eye-tests` - Create eye test
- GET `/eye-tests/my-tests` - Get patient tests
- GET `/eye-tests/pending-analysis` - Get pending tests (analyst)
- POST `/eye-tests/:id/analyze` - Run AI analysis

### Prescriptions
- GET `/prescriptions/my-prescriptions` - Get prescriptions
- PUT `/prescriptions/:id/assign-pharmacy` - Assign to pharmacy

### Admin
- GET `/admin/users` - Get all users
- GET `/admin/analytics` - Get system analytics

## Roles

- `patient` - Patients
- `analyst` - Test analysts
- `doctor` - Doctors
- `admin` - Administrators
- `pharmacy` - Pharmacy/Optical shops

