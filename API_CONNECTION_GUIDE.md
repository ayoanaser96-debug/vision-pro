# Vision Clinic - API Connection Guide

## ✅ Setup Complete!

All APIs are now connected between frontend and backend, and the database is properly configured.

## 🔐 Test Credentials

Use these credentials to test the login:

### Admin
- **Email:** `admin@visionclinic.com`
- **Password:** `password123`
- **Dashboard:** `/dashboard/admin`

### Doctor
- **Email:** `dr.sarah@visionclinic.com`
- **Password:** `password123`
- **Dashboard:** `/dashboard/doctor`

### Patient
- **Email:** `ahmed.ali@email.com`
- **Password:** `password123`
- **Dashboard:** `/dashboard/patient`

### Optometrist
- **Email:** `optometrist1@visionclinic.com`
- **Password:** `password123`
- **Dashboard:** `/dashboard/optometrist`

### Pharmacy
- **Email:** `pharmacy@visionclinic.com`
- **Password:** `password123`
- **Dashboard:** `/dashboard/pharmacy`

## 🌐 API Endpoints

### Backend URL
- **Development:** `http://localhost:3001`
- **Frontend:** `http://localhost:3000`

### Key Endpoints

#### Authentication
- `POST /auth/login` - Login with identifier (email/phone/nationalId) and password
- `POST /auth/register` - Register new user
- `GET /auth/profile` - Get current user profile (requires auth)
- `POST /auth/refresh` - Refresh token

#### Patients
- `GET /patients/profile` - Get patient profile
- `GET /patients/medical-journey` - Get unified medical journey
- `GET /patients/health-timeline` - Get health timeline
- `GET /patients/billing-history` - Get billing history

#### Appointments
- `GET /appointments` - Get appointments
- `POST /appointments` - Create appointment
- `PUT /appointments/:id` - Update appointment

#### Eye Tests
- `GET /eye-tests` - Get eye tests
- `POST /eye-tests` - Create eye test
- `GET /eye-tests/:id` - Get specific test

#### Prescriptions
- `GET /prescriptions` - Get prescriptions
- `POST /prescriptions` - Create prescription
- `PUT /prescriptions/:id/status` - Update prescription status

## 🔧 Configuration Files

### Backend `.env`
```env
DATABASE_URL="mysql://root@localhost:3306/vision_clinic"
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🚀 Starting the Application

### Backend
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed  # Optional: seed test data
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## ✅ Verification Checklist

- [x] Backend server running on port 3001
- [x] Frontend server running on port 3000
- [x] MySQL database connected
- [x] Prisma migrations applied
- [x] Test users seeded
- [x] CORS configured
- [x] API endpoints working
- [x] Authentication flow working
- [x] Role-based redirects working

## 🐛 Troubleshooting

### Login not working?
1. Check backend is running: `curl http://localhost:3001/health`
2. Check frontend `.env.local` has correct API URL
3. Check browser console for errors
4. Verify credentials match seeded users

### CORS errors?
- Backend CORS is configured for `http://localhost:3000`
- Check `main.ts` CORS settings

### Database connection errors?
- Verify MySQL is running: `mysql -u root -e "SHOW DATABASES;"`
- Check `.env` DATABASE_URL is correct
- Run migrations: `npm run prisma:migrate`

## 📝 Next Steps

1. **Test Login:** Go to `http://localhost:3000/login` and login with test credentials
2. **Verify Dashboard:** After login, you should be redirected to your role-specific dashboard
3. **Test Features:** Try creating appointments, viewing tests, etc.

All APIs are connected and ready to use! 🎉





