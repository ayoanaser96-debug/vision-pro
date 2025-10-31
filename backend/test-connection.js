// Quick MongoDB connection test
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vision-clinic';

async function testConnection() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connection successful!');
    console.log(`Connected to database: ${mongoose.connection.name}`);
    
    // Test collection operations
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`\n📊 Collections: ${collections.length}`);
    
    await mongoose.connection.close();
    console.log('✅ Connection closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();


