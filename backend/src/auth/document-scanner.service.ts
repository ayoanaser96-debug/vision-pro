import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument, UserDocumentDocument, DocumentType } from './schemas/user-document.schema';

@Injectable()
export class DocumentScannerService {
  constructor(
    @InjectModel(UserDocument.name)
    private userDocumentModel: Model<UserDocumentDocument>,
  ) {}

  async scanDocument(
    userId: string,
    documentType: DocumentType,
    frontImage: string,
    backImage?: string,
  ): Promise<UserDocumentDocument> {
    try {
      // Process front image
      const frontProcessed = await this.preprocessImage(frontImage);
      
      // Extract text using OCR
      const extractedData = await this.extractTextFromImage(frontProcessed, documentType);

      // If back image provided, process it too
      if (backImage) {
        const backProcessed = await this.preprocessImage(backImage);
        const backData = await this.extractTextFromImage(backProcessed, documentType);
        
        // Merge back data into extracted data
        if (backData) {
          Object.assign(extractedData, backData);
        }
      }

      // Calculate OCR confidence
      const ocrConfidence = this.calculateConfidence(extractedData);

      // Check if document already exists
      const existing = await this.userDocumentModel.findOne({
        userId,
        documentType,
        isActive: true,
      });

      if (existing) {
        // Update existing document
        existing.frontImage = frontImage;
        if (backImage) existing.backImage = backImage;
        existing.extractedData = extractedData;
        existing.ocrConfidence = ocrConfidence;
        existing.metadata = {
          ...existing.metadata,
          scannedAt: new Date(),
          imageQuality: this.assessImageQuality(frontImage),
        };
        return existing.save();
      } else {
        // Create new document
        const userDocument = new this.userDocumentModel({
          userId,
          documentType,
          frontImage,
          backImage,
          extractedData,
          ocrConfidence,
          metadata: {
            scannedAt: new Date(),
            imageQuality: this.assessImageQuality(frontImage),
            verified: false,
          },
          isActive: true,
        });
        return userDocument.save();
      }
    } catch (error: any) {
      throw new Error(`Failed to scan document: ${error.message}`);
    }
  }

  private async preprocessImage(imageBase64: string): Promise<Buffer> {
    try {
      // Convert base64 to buffer for OCR processing
      return Buffer.from(imageBase64, 'base64');
    } catch (error) {
      throw new Error('Failed to preprocess image');
    }
  }

  private async extractTextFromImage(
    imageBuffer: Buffer,
    documentType: DocumentType,
  ): Promise<any> {
    try {
      // Use Tesseract.js for OCR (dynamically imported to handle optional dependency)
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const { data } = await worker.recognize(imageBuffer);
      await worker.terminate();

      // Parse extracted text based on document type
      const extractedData = this.parseDocumentData(data.text, documentType);

      return extractedData;
    } catch (error: any) {
      console.error('OCR error:', error.message);
      // Return basic structure even if OCR fails
      return {
        rawText: '',
        documentType,
        ocrError: error.message,
      };
    }
  }

  private parseDocumentData(text: string, documentType: DocumentType): any {
    const data: any = {
      rawText: text,
      documentType,
    };

    // Common patterns for ID cards and passports
    const patterns = {
      // Full name pattern
      fullName: /(?:name|full name)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
      
      // Date of birth pattern
      dateOfBirth: /(?:date of birth|dob|birth date)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      
      // Document number pattern
      documentNumber: /(?:document|id|passport|number|no\.?)[:\s]*([A-Z0-9]{6,15})/i,
      
      // Nationality
      nationality: /(?:nationality|country)[:\s]*([A-Z][a-z]+)/i,
      
      // Expiry date
      expiryDate: /(?:expiry|expires|valid until)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      
      // Address
      address: /(?:address)[:\s]*([A-Z0-9\s,]+)/i,
    };

    // Extract data using patterns
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match && match[1]) {
        data[key] = match[1].trim();
      }
    }

    // Try to extract name from common positions
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0 && !data.fullName) {
      // First line might be name
      const firstLine = lines[0].trim();
      if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$/.test(firstLine)) {
        data.fullName = firstLine;
        const nameParts = firstLine.split(/\s+/);
        if (nameParts.length >= 2) {
          data.firstName = nameParts[0];
          data.lastName = nameParts[nameParts.length - 1];
          if (nameParts.length > 2) {
            data.middleName = nameParts.slice(1, -1).join(' ');
          }
        }
      }
    }

    return data;
  }

  private calculateConfidence(extractedData: any): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on extracted fields
    if (extractedData.fullName) confidence += 0.15;
    if (extractedData.dateOfBirth) confidence += 0.1;
    if (extractedData.documentNumber) confidence += 0.15;
    if (extractedData.nationality) confidence += 0.05;
    if (extractedData.expiryDate) confidence += 0.05;

    return Math.min(confidence, 0.95);
  }

  private assessImageQuality(imageBase64: string): number {
    try {
      // Simplified quality assessment
      // In production, use more sophisticated algorithms
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      const size = imageBuffer.length;
      
      // Quality based on image size (larger usually means better quality)
      if (size > 500000) return 0.9; // High quality
      if (size > 200000) return 0.7; // Medium quality
      return 0.5; // Low quality
    } catch (error) {
      return 0.5;
    }
  }

  async getDocuments(userId: string): Promise<UserDocumentDocument[]> {
    return this.userDocumentModel.find({ userId, isActive: true }).sort({ createdAt: -1 });
  }

  async getDocument(userId: string, documentType: DocumentType): Promise<UserDocumentDocument | null> {
    return this.userDocumentModel.findOne({ userId, documentType, isActive: true });
  }

  async verifyDocument(
    documentId: string,
    verifiedBy: string,
  ): Promise<UserDocumentDocument | null> {
    return this.userDocumentModel.findByIdAndUpdate(
      documentId,
      {
        'metadata.verified': true,
        'metadata.verifiedBy': verifiedBy,
        'metadata.verifiedAt': new Date(),
      },
      { new: true },
    );
  }
}

