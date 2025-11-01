import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    
    // Enable CORS
    app.enableCors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    });

    // Enable validation pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      }),
    );

    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`✅ Application is running on: http://localhost:${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    
    // Log MongoDB connection status
    console.log(`📦 MongoDB: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/vision-clinic'}`);
  } catch (error: any) {
    console.error('❌ Server startup error:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

