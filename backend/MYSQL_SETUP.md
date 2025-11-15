# MySQL Setup Guide for Vision Clinic Backend

This guide will help you set up MySQL for offline use with the Vision Clinic backend.

## Prerequisites

1. **Install MySQL**
   - macOS: `brew install mysql`
   - Linux: `sudo apt-get install mysql-server` (Ubuntu/Debian) or `sudo yum install mysql-server` (CentOS/RHEL)
   - Windows: Download from [MySQL Official Website](https://dev.mysql.com/downloads/mysql/)

2. **Start MySQL Service**
   - macOS: `brew services start mysql`
   - Linux: `sudo systemctl start mysql` or `sudo service mysql start`
   - Windows: MySQL should start automatically as a service

## Setup Steps

### 1. Create Database

Connect to MySQL and create the database:

```bash
mysql -u root -p
```

Then run:
```sql
CREATE DATABASE vision_clinic;
CREATE USER 'vision_user'@'localhost' IDENTIFIED BY 'your_password_here';
GRANT ALL PRIVILEGES ON vision_clinic.* TO 'vision_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
touch .env
```

Add the following to `.env`:

```env
DATABASE_URL="mysql://vision_user:your_password_here@localhost:3306/vision_clinic"
PORT=3001
JWT_SECRET=your_jwt_secret_here
```

**Important:** Replace `your_password_here` and `your_jwt_secret_here` with secure values.

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Run Database Migrations

```bash
npm run prisma:migrate
```

This will create all the database tables based on the Prisma schema.

### 5. Seed Database (Optional)

```bash
npm run prisma:seed
```

### 6. Start the Backend

```bash
npm run start:dev
```

## Quick Setup Script

You can run all setup steps at once:

```bash
npm run db:setup
```

This will:
1. Generate Prisma Client
2. Run migrations
3. Seed the database

## Troubleshooting

### Connection Refused Error

If you see `ECONNREFUSED` or `P1001` errors:

1. **Check MySQL is running:**
   ```bash
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status mysql
   ```

2. **Verify DATABASE_URL format:**
   ```
   mysql://username:password@host:port/database_name
   ```

3. **Test MySQL connection:**
   ```bash
   mysql -u vision_user -p vision_clinic
   ```

### Reset Database

If you need to reset the database:

```bash
npm run db:reset
```

This will drop the database, recreate it, run migrations, and seed it.

## Offline Usage

Once MySQL is set up, the application works completely offline. No internet connection is required for:
- Database operations
- User authentication
- Data storage and retrieval
- All backend features

## Migration from MongoDB

The backend has been migrated from MongoDB to MySQL. All services will need to be updated to use Prisma instead of Mongoose. This is a work in progress.





