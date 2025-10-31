#!/bin/bash

# MongoDB Setup Script for Vision Clinic
echo "🔧 Setting up MongoDB for Vision Clinic..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "❌ MongoDB is not running. Starting MongoDB..."
    sudo systemctl start mongod || service mongod start
    sleep 2
fi

# Verify MongoDB connection
echo "🔍 Testing MongoDB connection..."
mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ MongoDB is running and accessible"
else
    echo "❌ MongoDB connection failed. Please check your MongoDB installation."
    exit 1
fi

# Create database and verify
echo "📊 Creating/verifying database: vision-clinic..."
mongosh vision-clinic --eval "db.getName(); print('✅ Database vision-clinic is ready')" --quiet > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database setup complete!"
    echo ""
    echo "📝 Connection details:"
    echo "   URI: mongodb://localhost:27017/vision-clinic"
    echo "   Port: 27017"
    echo "   Database: vision-clinic"
    echo ""
    echo "🚀 You can now start the backend server with: npm run start:dev"
else
    echo "⚠️  Warning: Could not verify database creation, but MongoDB is running"
fi


