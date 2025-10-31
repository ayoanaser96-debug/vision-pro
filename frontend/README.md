# Vision Clinic Frontend

Smart Vision Clinic Frontend built with Next.js and shadcn/ui.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Features

- **Patient Portal**: Book appointments, view test results, manage prescriptions
- **Analyst Dashboard**: Review and analyze eye tests with AI assistance
- **Doctor Dashboard**: Review cases, create prescriptions, manage patients
- **Admin Panel**: User management, system analytics
- **Pharmacy Dashboard**: Manage prescriptions and orders

## Pages

- `/login` - Login/Register page
- `/dashboard/patient` - Patient dashboard
- `/dashboard/analyst` - Analyst dashboard
- `/dashboard/doctor` - Doctor dashboard
- `/dashboard/admin` - Admin panel
- `/dashboard/pharmacy` - Pharmacy dashboard

## Authentication

Users can login with:
- Email
- Phone number
- National ID

All dashboards are protected and require authentication.


