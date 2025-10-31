import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prescription, PrescriptionDocument } from '../prescriptions/schemas/prescription.schema';
import { InventoryItem, InventoryItemDocument } from './schemas/inventory-item.schema';
import { Supplier, SupplierDocument } from './schemas/supplier.schema';
import { PrescriptionsService } from '../prescriptions/prescriptions.service';
// QRCode import - using dynamic import to handle if library is not installed
let QRCode: any;
try {
  QRCode = require('qrcode');
} catch (e) {
  console.warn('QRCode library not installed, QR code generation will be limited');
}

@Injectable()
export class PharmacyEnhancedService {
  constructor(
    @InjectModel(Prescription.name)
    private prescriptionModel: Model<PrescriptionDocument>,
    @InjectModel(InventoryItem.name)
    private inventoryModel: Model<InventoryItemDocument>,
    @InjectModel(Supplier.name)
    private supplierModel: Model<SupplierDocument>,
    private prescriptionsService: PrescriptionsService,
  ) {}

  // 1. Smart Prescription Management
  async getPrescriptionsForPharmacy(pharmacyId: string) {
    return this.prescriptionModel
      .find({ pharmacyId, status: { $in: ['pending', 'processing', 'ready'] } })
      .populate('patientId', 'firstName lastName email phone')
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ createdAt: -1 });
  }

  async generatePrescriptionQR(prescriptionId: string): Promise<string> {
    const prescription = await this.prescriptionModel.findById(prescriptionId);
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    // Generate QR code with prescription data
    const qrData = {
      prescriptionId: prescription._id.toString(),
      patientId: prescription.patientId.toString(),
      doctorId: prescription.doctorId?.toString(),
      createdAt: prescription.createdAt,
      status: prescription.status,
    };

    try {
      if (QRCode && typeof QRCode.toDataURL === 'function') {
        const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));
        return qrCodeDataURL;
      }
      // Fallback: return QR data as base64 encoded JSON
      return Buffer.from(JSON.stringify(qrData)).toString('base64');
    } catch (error) {
      // Fallback: return QR data as string if QRCode library not available
      return Buffer.from(JSON.stringify(qrData)).toString('base64');
    }
  }

  async validatePrescription(prescriptionId: string, patientHistory?: any) {
    const prescription = await this.prescriptionModel
      .findById(prescriptionId)
      .populate('patientId')
      .populate('doctorId');

    if (!prescription) {
      throw new Error('Prescription not found');
    }

    const warnings = [];
    const errors = [];

    // Check for duplicate prescriptions
    const recentPrescriptions = await this.prescriptionModel.find({
      patientId: prescription.patientId,
      createdAt: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
      'medications.name': { $in: prescription.medications.map((m: any) => m.name) },
    });

    if (recentPrescriptions.length > 1) {
      warnings.push('Duplicate prescription detected');
    }

    // Check drug interactions (simulated)
    if (prescription.medications.length > 1) {
      const drugNames = prescription.medications.map((m: any) => m.name.toLowerCase());
      // Simulate interaction check
      if (drugNames.some(name => name.includes('warfarin')) && 
          drugNames.some(name => name.includes('aspirin'))) {
        errors.push('Potential drug interaction: Warfarin + Aspirin');
      }
    }

    // Check allergies (if patient history provided)
    if (patientHistory?.allergies) {
      const allergies = patientHistory.allergies.map((a: string) => a.toLowerCase());
      prescription.medications.forEach((med: any) => {
        if (allergies.some((allergy: string) => 
          med.name.toLowerCase().includes(allergy) || 
          med.name.toLowerCase() === allergy
        )) {
          errors.push(`Allergy detected: Patient is allergic to ${med.name}`);
        }
      });
    }

    // Check if prescription is expired (older than 30 days)
    const daysSinceCreation = (Date.now() - new Date(prescription.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 30) {
      warnings.push('Prescription is older than 30 days');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      prescription,
    };
  }

  async updatePrescriptionStatus(prescriptionId: string, status: string, notes?: string) {
    return this.prescriptionModel.findByIdAndUpdate(
      prescriptionId,
      { 
        status,
        pharmacyNotes: notes,
        ...(status === 'ready' && { readyAt: new Date() }),
        ...(status === 'delivered' && { deliveredAt: new Date() }),
        ...(status === 'completed' && { completedAt: new Date() }),
      },
      { new: true },
    );
  }

  // 2. AI & Automation
  async getAIDrugSuggestions(prescriptionId: string, stockLevels?: any[]) {
    const prescription = await this.prescriptionModel.findById(prescriptionId);
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    const suggestions = [];

    for (const medication of prescription.medications) {
      // Find cheaper alternatives
      const alternatives = await this.inventoryModel.find({
        $or: [
          { genericName: { $regex: medication.name, $options: 'i' } },
          { alternativeNames: { $regex: medication.name, $options: 'i' } },
        ],
        stock: { $gt: 0 },
        expiryDate: { $gt: new Date() },
      }).limit(3);

      if (alternatives.length > 0) {
        alternatives.forEach((alt: any) => {
          const estimatedPrice = 50; // Default estimated price
          const isCheaper = alt.sellingPrice < estimatedPrice;
          const isInStock = alt.stock > 0;
          
          suggestions.push({
            originalMedication: medication.name,
            alternative: {
              name: alt.name,
              genericName: alt.genericName,
              price: alt.sellingPrice,
              stock: alt.stock,
              savings: isCheaper ? estimatedPrice - alt.sellingPrice : 0,
            },
            reason: isCheaper ? 'Cheaper alternative' : isInStock ? 'Available in stock' : 'Alternative option',
          });
        });
      }
    }

    return suggestions;
  }

  async getStockForecast(days: number = 30) {
    // Get recent prescriptions to analyze trends
    const recentPrescriptions = await this.prescriptionModel.find({
      createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    });

    // Count medication frequency
    const medicationFrequency: Record<string, number> = {};
    recentPrescriptions.forEach((pres: any) => {
      pres.medications?.forEach((med: any) => {
        const key = med.name.toLowerCase();
        medicationFrequency[key] = (medicationFrequency[key] || 0) + 1;
      });
    });

    // Predict future demand
    const predictions = [];
    for (const [medName, frequency] of Object.entries(medicationFrequency)) {
      const avgDailyDemand = frequency / days;
      const predictedDemand = avgDailyDemand * 30; // Next 30 days

      // Find in inventory
      const inventoryItem = await this.inventoryModel.findOne({
        $or: [
          { name: { $regex: medName, $options: 'i' } },
          { genericName: { $regex: medName, $options: 'i' } },
        ],
      });

      if (inventoryItem) {
        const daysUntilLowStock = inventoryItem.stock / avgDailyDemand;
        predictions.push({
          medication: medName,
          currentStock: inventoryItem.stock,
          predictedDemand: Math.ceil(predictedDemand),
          daysUntilLowStock: Math.floor(daysUntilLowStock),
          needsReorder: daysUntilLowStock < 7,
          priority: daysUntilLowStock < 3 ? 'urgent' : daysUntilLowStock < 7 ? 'high' : 'medium',
        });
      }
    }

    return predictions.sort((a, b) => a.daysUntilLowStock - b.daysUntilLowStock);
  }

  // 3. Inventory & Stock Management
  async getInventory(pharmacyId?: string) {
    const query: any = {};
    if (pharmacyId) query.pharmacyId = pharmacyId;

    return this.inventoryModel.find(query).sort({ name: 1 });
  }

  async getLowStockItems(pharmacyId?: string) {
    const query: any = {
      $or: [
        { stock: { $lte: { $ifNull: ['$reorderLevel', 10] } } },
        { stock: { $lte: 10 } },
      ],
    };
    if (pharmacyId) query.pharmacyId = pharmacyId;

    return this.inventoryModel.find(query).sort({ stock: 1 });
  }

  async getExpiringSoon(days: number = 30, pharmacyId?: string) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    const query: any = {
      expiryDate: { $lte: expiryDate, $gte: new Date() },
    };
    if (pharmacyId) query.pharmacyId = pharmacyId;

    return this.inventoryModel.find(query).sort({ expiryDate: 1 });
  }

  async updateInventory(itemId: string, update: any) {
    return this.inventoryModel.findByIdAndUpdate(itemId, update, { new: true });
  }

  async createInventoryItem(itemData: any) {
    const item = new this.inventoryModel(itemData);
    return item.save();
  }

  // 4. Supplier Management
  async getSuppliers(pharmacyId?: string) {
    const query: any = {};
    if (pharmacyId) query.pharmacyId = pharmacyId;

    return this.supplierModel.find(query).sort({ name: 1 });
  }

  async createSupplier(supplierData: any) {
    const supplier = new this.supplierModel(supplierData);
    return supplier.save();
  }

  async updateSupplierRating(supplierId: string, rating: any) {
    const overall = (rating.deliveryTime + rating.reliability + rating.quality) / 3;
    return this.supplierModel.findByIdAndUpdate(
      supplierId,
      { rating: { ...rating, overall } },
      { new: true },
    );
  }

  // 5. Delivery & Logistics
  async createDeliveryOrder(prescriptionId: string, deliveryData: any) {
    const prescription = await this.prescriptionModel.findByIdAndUpdate(
      prescriptionId,
      {
        status: 'processing',
        deliveryInfo: {
          address: deliveryData.address,
          phone: deliveryData.phone,
          estimatedDelivery: deliveryData.estimatedDelivery,
          trackingNumber: this.generateTrackingNumber(),
          status: 'dispatched',
          createdAt: new Date(),
        },
      },
      { new: true },
    );
    return prescription;
  }

  async updateDeliveryStatus(prescriptionId: string, status: string, location?: string) {
    return this.prescriptionModel.findByIdAndUpdate(
      prescriptionId,
      {
        'deliveryInfo.status': status,
        ...(location && { 'deliveryInfo.currentLocation': location }),
        ...(status === 'delivered' && { 'deliveryInfo.deliveredAt': new Date() }),
      },
      { new: true },
    );
  }

  private generateTrackingNumber(): string {
    return 'TRK' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }

  // 6. Analytics
  async getPharmacyAnalytics(pharmacyId: string, startDate?: Date, endDate?: Date) {
    const query: any = { pharmacyId };
    if (startDate) query.createdAt = { $gte: startDate };
    if (endDate && query.createdAt) {
      query.createdAt.$lte = endDate;
    }

    const prescriptions = await this.prescriptionModel.find(query).lean();
    const inventory = await this.inventoryModel.find({ pharmacyId }).lean();

    // Top prescribed medications
    const medicationCounts: Record<string, number> = {};
    prescriptions.forEach((pres: any) => {
      pres.medications?.forEach((med: any) => {
        const key = med.name;
        medicationCounts[key] = (medicationCounts[key] || 0) + 1;
      });
    });

    const topMedications = Object.entries(medicationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalPrescriptions: prescriptions.length,
      pending: prescriptions.filter((p: any) => p.status === 'pending').length,
      processing: prescriptions.filter((p: any) => p.status === 'processing').length,
      ready: prescriptions.filter((p: any) => p.status === 'ready').length,
      delivered: prescriptions.filter((p: any) => p.status === 'delivered').length,
      totalInventoryItems: inventory.length,
      lowStockItems: inventory.filter((item: any) => item.stock <= (item.reorderLevel || 10)).length,
      topMedications,
      revenue: prescriptions
        .filter((p: any) => p.status === 'delivered' || p.status === 'completed')
        .reduce((sum: number, pres: any) => sum + (pres.totalAmount || 0), 0),
    };
  }

  // 7. Drug Demand Analytics
  async getDrugDemandAnalytics(pharmacyId?: string, days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const query: any = { createdAt: { $gte: startDate } };
    if (pharmacyId) query.pharmacyId = pharmacyId;

    const prescriptions = await this.prescriptionModel.find(query).lean();
    
    const drugDemand: Record<string, {
      count: number;
      byCondition: Record<string, number>;
      byDoctor: Record<string, number>;
    }> = {};

    prescriptions.forEach((pres: any) => {
      pres.medications?.forEach((med: any) => {
        const key = med.name;
        if (!drugDemand[key]) {
          drugDemand[key] = { count: 0, byCondition: {}, byDoctor: {} };
        }
        drugDemand[key].count++;
        
        if (pres.diagnosis) {
          drugDemand[key].byCondition[pres.diagnosis] = 
            (drugDemand[key].byCondition[pres.diagnosis] || 0) + 1;
        }
        
        if (pres.doctorId) {
          const doctorName = `${pres.doctorId?.firstName || ''} ${pres.doctorId?.lastName || ''}`.trim();
          drugDemand[key].byDoctor[doctorName] = 
            (drugDemand[key].byDoctor[doctorName] || 0) + 1;
        }
      });
    });

    return Object.entries(drugDemand).map(([drug, data]) => ({
      drug,
      ...data,
    })).sort((a, b) => b.count - a.count);
  }
}

