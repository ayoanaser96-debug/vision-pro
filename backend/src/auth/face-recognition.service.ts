import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserFace, UserFaceDocument } from './schemas/user-face.schema';
import * as crypto from 'crypto';

@Injectable()
export class FaceRecognitionService {
  constructor(
    @InjectModel(UserFace.name)
    private userFaceModel: Model<UserFaceDocument>,
  ) {}

  async registerFace(userId: string, faceImage: string): Promise<UserFaceDocument> {
    try {
      // Extract face descriptor from image
      const descriptor = await this.extractFaceDescriptor(faceImage);

      // Check if face already exists for this user
      const existing = await this.userFaceModel.findOne({ userId });
      
      if (existing) {
        // Update existing face data
        existing.faceDescriptor = descriptor;
        existing.faceImage = faceImage;
        existing.confidence = 0.95; // Set confidence after registration
        return existing.save();
      } else {
        // Create new face record
        const userFace = new this.userFaceModel({
          userId,
          faceDescriptor: descriptor,
          faceImage,
          confidence: 0.95,
          isActive: true,
        });
        return userFace.save();
      }
    } catch (error: any) {
      throw new Error(`Failed to register face: ${error.message}`);
    }
  }

  async recognizeFace(faceImage: string, threshold: number = 0.6): Promise<any> {
    try {
      // Extract face descriptor from provided image
      const queryDescriptor = await this.extractFaceDescriptor(faceImage);

      // Find all active face records
      const allFaces = await this.userFaceModel.find({ isActive: true }).populate('userId');

      let bestMatch = null;
      let bestDistance = Infinity;

      // Compare with all registered faces
      for (const face of allFaces) {
        const distance = this.calculateDistance(queryDescriptor, face.faceDescriptor);
        
        if (distance < threshold && distance < bestDistance) {
          bestDistance = distance;
          bestMatch = {
            userId: face.userId,
            confidence: 1 - distance, // Convert distance to confidence
            faceId: face._id,
            user: face.userId,
          };
        }
      }

      return bestMatch;
    } catch (error: any) {
      throw new Error(`Failed to recognize face: ${error.message}`);
    }
  }

  private async extractFaceDescriptor(imageBase64: string): Promise<string> {
    try {
      // In production, this would use face-api.js or similar to extract face descriptors
      // For now, we'll create a simplified descriptor based on image hash
      
      // Simulated face descriptor extraction
      // In real implementation, this would use actual face recognition library
      const hash = this.imageHash(imageBase64);
      return Buffer.from(hash).toString('base64');
    } catch (error: any) {
      throw new Error(`Failed to extract face descriptor: ${error.message}`);
    }
  }

  private calculateDistance(descriptor1: string, descriptor2: string): number {
    try {
      // Convert base64 back to compare
      const d1 = Buffer.from(descriptor1, 'base64');
      const d2 = Buffer.from(descriptor2, 'base64');

      // Calculate Euclidean distance (simplified)
      // In production, use proper face descriptor comparison
      let distance = 0;
      const minLength = Math.min(d1.length, d2.length);
      
      for (let i = 0; i < minLength; i++) {
        const diff = d1[i] - d2[i];
        distance += diff * diff;
      }
      
      return Math.sqrt(distance / minLength);
    } catch (error) {
      return 1.0; // Maximum distance if comparison fails
    }
  }

  private imageHash(imageBase64: string): string {
    // Create a hash from the image data
    // In production, use actual face recognition algorithm (face-api.js, MediaPipe, etc.)
    const hash = crypto.createHash('sha256');
    hash.update(imageBase64);
    return hash.digest('hex').substring(0, 128); // Return first 128 chars as descriptor
  }

  async getFaceData(userId: string): Promise<UserFaceDocument | null> {
    return this.userFaceModel.findOne({ userId, isActive: true });
  }

  async deleteFace(userId: string): Promise<boolean> {
    const result = await this.userFaceModel.updateOne(
      { userId },
      { isActive: false },
    );
    return result.modifiedCount > 0;
  }
}

