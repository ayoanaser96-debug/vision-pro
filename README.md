# Smart Vision Clinic Platform

A comprehensive smart vision clinic management system built with NestJS (Backend) and Next.js (Frontend) with MongoDB database.

## 🎯 Features

### 👩‍⚕️ Patient Portal
- Register/Login via phone, email, or national ID
- Book appointments
- Upload test results
- View medical history and prescriptions
- Real-time chat/video consultation with doctors
- Get notified when test results or prescriptions are ready

### 🧪 Eye Test & Analyzer Module
- Visual Acuity tests (Snellen chart)
- Color Vision tests
- Refraction tests (sphere, cylinder, axis)
- Retina imaging upload
- AI-assisted analyzer for early detection of:
  - Cataract
  - Glaucoma
  - Diabetic Retinopathy

### 📊 Analyst Dashboard
- View patient tests awaiting analysis
- Use analyzer to interpret raw test data
- Approve or adjust AI results before sending to doctor
- Add notes for doctors

### 👨‍⚕️ Doctor Dashboard
- Get assigned patients automatically (by specialty)
- View complete case with test data + analysis report
- Approve, reject, or add to AI recommendations
- Create treatment plans or prescriptions
- Send digital prescriptions to pharmacy/optical shop

### 🕹️ Admin Panel
- Manage users (patients, analysts, doctors, pharmacies)
- Track test device integrations
- Manage appointments and billing
- Monitor system analytics (patients per day, diagnosis stats, etc.)
- Role-based access control (RBAC)

### 🏥 Pharmacy/Optical Integration
- Link prescriptions to verified optical shops or pharmacies
- Allow online ordering of glasses/contact lenses
- Track order and delivery

## 🏗️ Project Structure

```
vision pro/
├── backend/          # NestJS Backend API
├── frontend/         # Next.js Frontend Application
└── README.md        # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (installed and running locally or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in the backend directory:
```env
MONGODB_URI=mongodb://localhost:27017/vision-clinic
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

4. Make sure MongoDB is running:
```bash
# If MongoDB is installed locally, start it:
mongod

# Or use MongoDB Atlas connection string in MONGODB_URI
```

5. Start the backend server:
```bash
npm run start:dev
```

The backend API will be available at `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Start the frontend development server:
```bash
npm run dev
```

The frontend application will be available at `http://localhost:3000`

## 📖 Usage

1. **Register/Login**: Visit `http://localhost:3000/login` and create an account or login
   - You can register as: Patient, Doctor, Analyst, Admin, or Pharmacy
   - Login with email, phone, or national ID

2. **Access Dashboard**: After login, you'll be redirected to your role-specific dashboard

3. **Patient Features**:
   - Book appointments
   - Upload eye test results
   - View medical history
   - Chat with doctors
   - View prescriptions

4. **Analyst Features**:
   - View pending eye tests
   - Run AI analysis
   - Add analyst notes
   - Approve results for doctor review

5. **Doctor Features**:
   - Review analyzed cases
   - Approve/reject AI recommendations
   - Create prescriptions
   - Manage patients

6. **Admin Features**:
   - Manage all users
   - View system analytics
   - Monitor appointments and tests

## 🔐 Roles & Permissions

- **Patient**: Can book appointments, upload tests, view history
- **Analyst**: Can analyze eye tests, add notes
- **Doctor**: Can review cases, create prescriptions
- **Admin**: Full system access
- **Pharmacy**: Can manage prescriptions and orders

## 🛠️ Tech Stack

### Backend
- **NestJS**: Modern Node.js framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: Authentication
- **Socket.io**: Real-time chat
- **Passport**: Authentication strategies

### Frontend
- **Next.js 14**: React framework
- **TypeScript**: Type safety
- **shadcn/ui**: UI component library
- **Tailwind CSS**: Styling
- **Axios**: HTTP client
- **Socket.io Client**: Real-time communication

## 📝 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `GET /auth/profile` - Get current user

### Patients
- `GET /patients/profile` - Get patient profile
- `PUT /patients/profile` - Update profile
- `GET /patients/medical-history` - Get medical history

### Appointments
- `POST /appointments` - Create appointment
- `GET /appointments/my-appointments` - Get user appointments
- `PUT /appointments/:id` - Update appointment

### Eye Tests
- `POST /eye-tests` - Create eye test
- `GET /eye-tests/my-tests` - Get patient tests
- `GET /eye-tests/pending-analysis` - Get pending tests (analyst)
- `POST /eye-tests/:id/analyze` - Run AI analysis
- `PUT /eye-tests/:id/analyst-notes` - Add analyst notes
- `PUT /eye-tests/:id/doctor-review` - Doctor review

### Prescriptions
- `GET /prescriptions/my-prescriptions` - Get prescriptions
- `POST /doctors/prescriptions` - Create prescription
- `PUT /prescriptions/:id/assign-pharmacy` - Assign to pharmacy

### Admin
- `GET /admin/users` - Get all users
- `PUT /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete user
- `GET /admin/analytics` - Get system analytics

## 🔧 Development

### Backend
```bash
npm run start:dev  # Start development server with hot reload
npm run build      # Build for production
npm run start:prod # Start production server
```

### Frontend
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
```

## 📄 License

This project is for educational purposes.

## 🤝 Contributing

This is a complete implementation of a smart vision clinic platform. Feel free to extend and customize it according to your needs.

## ⚠️ Important Notes

1. **MongoDB**: Make sure MongoDB is running before starting the backend
2. **Environment Variables**: Update `.env` files with your actual values
3. **JWT Secret**: Use a strong secret key in production
4. **AI Model**: The current AI analysis is simulated. Replace with actual ML model integration for production use.
5. **Security**: Ensure proper security measures in production (HTTPS, secure secrets, etc.)


