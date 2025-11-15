import { Injectable, NotFoundException, Inject, forwardRef, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrescriptionsService } from '../prescriptions/prescriptions.service';
import { PrescriptionStatus, NotificationType, NotificationPriority } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
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
    private prisma: PrismaService,
    private prescriptionsService: PrescriptionsService,
    @Optional() @Inject(forwardRef(() => NotificationsService))
    private notificationsService?: NotificationsService,
  ) {}

  // 1. Smart Prescription Management
  async getPrescriptionsForPharmacy(pharmacyId: string) {
    // Get all prescriptions assigned to this pharmacy, including cancelled ones for history
    return this.prisma.prescription.findMany({
      where: {
        pharmacyId,
        // Include all statuses except only show active ones in UI
        status: { 
          in: [
            PrescriptionStatus.PENDING, 
            PrescriptionStatus.PROCESSING, 
            PrescriptionStatus.READY,
            PrescriptionStatus.DELIVERED,
            PrescriptionStatus.COMPLETED,
            PrescriptionStatus.CANCELLED,
          ] 
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generatePrescriptionQR(prescriptionId: string): Promise<string> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
    });
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    const qrData = {
      prescriptionId: prescription.id,
      patientId: prescription.patientId,
      doctorId: prescription.doctorId,
      createdAt: prescription.createdAt,
      status: prescription.status,
    };

    try {
      if (QRCode && typeof QRCode.toDataURL === 'function') {
        const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));
        return qrCodeDataURL;
      }
      return Buffer.from(JSON.stringify(qrData)).toString('base64');
    } catch (error) {
      return Buffer.from(JSON.stringify(qrData)).toString('base64');
    }
  }

  async validatePrescription(prescriptionId: string, patientHistory?: any) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!prescription) {
      throw new Error('Prescription not found');
    }

    const warnings = [];
    const errors = [];
    const medications = prescription.medications as any[];

    // Check for duplicate prescriptions
    const recentPrescriptions = await this.prisma.prescription.findMany({
      where: {
        patientId: prescription.patientId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const duplicateMedications = recentPrescriptions.filter(pres => {
      const presMeds = (pres.medications as any[]) || [];
      return presMeds.some(med => medications.some(m => m.name === med.name));
    });

    if (duplicateMedications.length > 1) {
      warnings.push('Duplicate prescription detected');
    }

    // Check drug interactions
    if (medications.length > 1) {
      const drugNames = medications.map(m => m.name.toLowerCase());
      if (drugNames.some(name => name.includes('warfarin')) && 
          drugNames.some(name => name.includes('aspirin'))) {
        errors.push('Potential drug interaction: Warfarin + Aspirin');
      }
    }

    // Check allergies
    if (patientHistory?.allergies) {
      const allergies = patientHistory.allergies.map((a: string) => a.toLowerCase());
      medications.forEach((med: any) => {
        if (allergies.some((allergy: string) => 
          med.name.toLowerCase().includes(allergy) || 
          med.name.toLowerCase() === allergy
        )) {
          errors.push(`Allergy detected: Patient is allergic to ${med.name}`);
        }
      });
    }

    // Check if prescription is expired
    const daysSinceCreation = (Date.now() - prescription.createdAt.getTime()) / (1000 * 60 * 60 * 24);
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
    // Normalize status to uppercase to match Prisma enum
    const normalizedStatus = status.toUpperCase() as PrescriptionStatus;
    
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    const updateData: any = {
      status: normalizedStatus,
      ...(notes && { pharmacyNotes: notes }),
    };

    if (normalizedStatus === PrescriptionStatus.READY) updateData.readyAt = new Date();
    if (normalizedStatus === PrescriptionStatus.DELIVERED) updateData.deliveredAt = new Date();
    if (normalizedStatus === PrescriptionStatus.COMPLETED) updateData.completedAt = new Date();
    if (normalizedStatus === PrescriptionStatus.PROCESSING) {
      // Clear readyAt if going back to processing
      updateData.readyAt = null;
    }

    const updated = await this.prisma.prescription.update({
      where: { id: prescriptionId },
      data: updateData,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Send notifications to patient and doctor
    if (this.notificationsService) {
      const statusMessages: Record<string, { title: string; message: string }> = {
        PROCESSING: {
          title: 'Prescription Being Processed',
          message: `Your prescription is now being processed at the pharmacy. You will be notified when it's ready.`,
        },
        READY: {
          title: 'Prescription Ready for Pickup',
          message: `Your prescription is ready for pickup at the pharmacy. Please collect it at your earliest convenience.`,
        },
        DELIVERED: {
          title: 'Prescription Delivered',
          message: `Your prescription has been delivered. Please check your delivery details.`,
        },
        COMPLETED: {
          title: 'Prescription Completed',
          message: `Your prescription has been completed. Thank you for using our pharmacy services.`,
        },
      };

      const statusInfo = statusMessages[normalizedStatus];
      
      // Notify patient
      if (prescription.patient && statusInfo) {
        try {
          await this.notificationsService.create({
            userId: prescription.patient.id,
            type: NotificationType.PRESCRIPTION_READY,
            priority: normalizedStatus === PrescriptionStatus.READY ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
            title: statusInfo.title,
            message: statusInfo.message,
            relatedPrescriptionId: prescriptionId,
            metadata: {
              status: normalizedStatus,
              pharmacyNotes: notes,
              updatedAt: new Date().toISOString(),
            } as any,
          });
        } catch (error: any) {
          console.error('Failed to send notification to patient:', error.message);
        }
      }

      // Notify doctor
      if (prescription.doctor && statusInfo) {
        try {
          await this.notificationsService.create({
            userId: prescription.doctor.id,
            type: NotificationType.PRESCRIPTION_READY,
            priority: NotificationPriority.MEDIUM,
            title: `Prescription Status Updated: ${normalizedStatus}`,
            message: `Prescription for ${prescription.patient.firstName} ${prescription.patient.lastName} status updated to ${normalizedStatus}.${notes ? ` Notes: ${notes}` : ''}`,
            relatedPrescriptionId: prescriptionId,
            metadata: {
              status: normalizedStatus,
              pharmacyNotes: notes,
              patientName: `${prescription.patient.firstName} ${prescription.patient.lastName}`,
              updatedAt: new Date().toISOString(),
            } as any,
          });
        } catch (error: any) {
          console.error('Failed to send notification to doctor:', error.message);
        }
      }
    }

    return updated;
  }

  // 2. AI & Automation
  async getAIDrugSuggestions(prescriptionId: string, stockLevels?: any[]) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
    });
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    const suggestions = [];
    const medications = prescription.medications as any[];

    for (const medication of medications) {
      const alternatives = await this.prisma.inventoryItem.findMany({
        where: {
          OR: [
            { genericName: { contains: medication.name } },
            { name: { contains: medication.name } },
          ],
          stock: { gt: 0 },
          expiryDate: { gt: new Date() },
        },
        take: 3,
      });

      if (alternatives.length > 0) {
        alternatives.forEach((alt) => {
          const estimatedPrice = 50;
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
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentPrescriptions = await this.prisma.prescription.findMany({
      where: {
        createdAt: { gte: startDate },
      },
    });

    const medicationFrequency: Record<string, number> = {};
    recentPrescriptions.forEach((pres) => {
      const medications = pres.medications as any[];
      medications?.forEach((med: any) => {
        const key = med.name.toLowerCase();
        medicationFrequency[key] = (medicationFrequency[key] || 0) + 1;
      });
    });

    const predictions = [];
    for (const [medName, frequency] of Object.entries(medicationFrequency)) {
      const avgDailyDemand = frequency / days;
      const predictedDemand = avgDailyDemand * 30;

      const inventoryItem = await this.prisma.inventoryItem.findFirst({
        where: {
          OR: [
            { name: { contains: medName } },
            { genericName: { contains: medName } },
          ],
        },
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
    const where = pharmacyId ? { pharmacyId } : {};
    return this.prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getLowStockItems(pharmacyId?: string) {
    // Use a simpler query that works with Prisma
    const items = await this.prisma.inventoryItem.findMany({
      where: {
        ...(pharmacyId && { pharmacyId }),
      },
      orderBy: { stock: 'asc' },
    });

    // Filter in memory for low stock items
    return items.filter(item => 
      item.stock <= (item.reorderLevel || 10)
    );
  }

  async getExpiringSoon(days: number = 30, pharmacyId?: string) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    const where: any = {
      expiryDate: {
        lte: expiryDate,
        gte: new Date(),
      },
    };
    if (pharmacyId) where.pharmacyId = pharmacyId;

    return this.prisma.inventoryItem.findMany({
      where,
      orderBy: { expiryDate: 'asc' },
    });
  }

  async updateInventory(itemId: string, update: any) {
    return this.prisma.inventoryItem.update({
      where: { id: itemId },
      data: update,
    });
  }

  async createInventoryItem(itemData: any) {
    return this.prisma.inventoryItem.create({
      data: itemData,
    });
  }

  // 4. Supplier Management
  async getSuppliers(pharmacyId?: string) {
    const where = pharmacyId ? { pharmacyId } : {};
    return this.prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async createSupplier(supplierData: any) {
    return this.prisma.supplier.create({
      data: supplierData,
    });
  }

  async updateSupplierRating(supplierId: string, rating: any) {
    const overall = (rating.deliveryTime + rating.reliability + rating.quality) / 3;
    return this.prisma.supplier.update({
      where: { id: supplierId },
      data: {
        rating: {
          ...rating,
          overall,
        } as any,
      },
    });
  }

  // 5. Delivery & Logistics
  async createDeliveryOrder(prescriptionId: string, deliveryData: any) {
    const existing = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
    });
    
    if (!existing) {
      throw new Error('Prescription not found');
    }

    const deliveryInfo = {
      address: deliveryData.address,
      phone: deliveryData.phone,
      estimatedDelivery: deliveryData.estimatedDelivery,
      trackingNumber: this.generateTrackingNumber(),
      status: 'dispatched',
      createdAt: new Date(),
    };

    return this.prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        status: PrescriptionStatus.PROCESSING,
        deliveryInfo: deliveryInfo as any,
      },
    });
  }

  async updateDeliveryStatus(prescriptionId: string, status: string, location?: string) {
    const existing = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
    });
    
    if (!existing) {
      throw new Error('Prescription not found');
    }

    const deliveryInfo = {
      ...(existing.deliveryInfo as any || {}),
      status,
      ...(location && { currentLocation: location }),
      ...(status === 'delivered' && { deliveredAt: new Date() }),
    };

    return this.prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        deliveryInfo: deliveryInfo as any,
      },
    });
  }

  private generateTrackingNumber(): string {
    return 'TRK' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }

  // 6. Analytics
  async getPharmacyAnalytics(pharmacyId: string, startDate?: Date, endDate?: Date) {
    const where: any = { pharmacyId };
    if (startDate) where.createdAt = { gte: startDate };
    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: endDate };
    }

    const prescriptions = await this.prisma.prescription.findMany({ where });
    const inventory = await this.prisma.inventoryItem.findMany({ where: { pharmacyId } });

    const medicationCounts: Record<string, number> = {};
    prescriptions.forEach((pres) => {
      const medications = pres.medications as any[];
      medications?.forEach((med: any) => {
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
      pending: prescriptions.filter(p => p.status === PrescriptionStatus.PENDING).length,
      processing: prescriptions.filter(p => p.status === PrescriptionStatus.PROCESSING).length,
      ready: prescriptions.filter(p => p.status === PrescriptionStatus.READY).length,
      delivered: prescriptions.filter(p => p.status === PrescriptionStatus.DELIVERED).length,
      totalInventoryItems: inventory.length,
      lowStockItems: inventory.filter(item => item.stock <= (item.reorderLevel || 10)).length,
      topMedications,
      revenue: prescriptions
        .filter(p => p.status === PrescriptionStatus.DELIVERED || p.status === PrescriptionStatus.COMPLETED)
        .reduce((sum, pres) => sum + (pres.totalAmount || 0), 0),
    };
  }

  // 7. Check Prescription Item Availability
  async checkPrescriptionAvailability(prescriptionId: string, pharmacyId?: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    const medications = prescription.medications as any[];
    const availabilityCheck = {
      prescriptionId,
      allAvailable: true,
      missingItems: [] as Array<{ name: string; required: string; available: number; status: string }>,
      availableItems: [] as Array<{ name: string; available: number; status: string }>,
    };

    // Check each medication in the prescription
    for (const medication of medications) {
      const medName = medication.name;
      
      // Search for the medication in inventory
      const inventoryItems = await this.prisma.inventoryItem.findMany({
        where: {
          ...(pharmacyId && { pharmacyId }),
          OR: [
            { name: { contains: medName } },
            { genericName: { contains: medName } },
          ],
        },
      });

      // Check if any item is available and not expired
      const availableItem = inventoryItems.find(
        item => item.stock > 0 && new Date(item.expiryDate) > new Date()
      );

      if (!availableItem || availableItem.stock === 0) {
        availabilityCheck.allAvailable = false;
        availabilityCheck.missingItems.push({
          name: medName,
          required: medication.dosage || 'N/A',
          available: availableItem?.stock || 0,
          status: availableItem ? 'out_of_stock' : 'not_found',
        });
      } else {
        availabilityCheck.availableItems.push({
          name: medName,
          available: availableItem.stock,
          status: 'available',
        });
      }
    }

    // Check glasses if present
    const glasses = prescription.glasses as any[];
    if (glasses && glasses.length > 0) {
      // For glasses, we assume they need to be ordered/made, so we check if pharmacy handles glasses
      // This is a simplified check - in reality, you'd check frame/lens inventory
      availabilityCheck.availableItems.push({
        name: 'Glasses/Lenses',
        available: 0,
        status: 'requires_order',
      });
    }

    return availabilityCheck;
  }

  // 8. Reject/Return Prescription with Missing Items
  async rejectPrescription(
    prescriptionId: string,
    reason: string,
    missingItems: string[],
    pharmacyId?: string,
  ) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Update prescription status to CANCELLED and add pharmacy notes
    const updatedPrescription = await this.prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        status: PrescriptionStatus.CANCELLED,
        pharmacyId: null, // Remove pharmacy assignment
        pharmacyNotes: `REJECTED: ${reason}. Missing items: ${missingItems.join(', ')}`,
      },
    });

    // Send notification to doctor
    if (this.notificationsService && prescription.doctor) {
      try {
        await this.notificationsService.create({
          userId: prescription.doctor.id,
          type: NotificationType.PRESCRIPTION_READY,
          priority: NotificationPriority.HIGH,
          title: 'Prescription Returned - Items Unavailable',
          message: `Prescription for ${prescription.patient.firstName} ${prescription.patient.lastName} was returned due to unavailable items: ${missingItems.join(', ')}. Reason: ${reason}`,
          relatedPrescriptionId: prescriptionId,
          metadata: {
            reason,
            missingItems,
            returnedBy: pharmacyId || 'Pharmacy',
            returnedAt: new Date().toISOString(),
          } as any,
        });
      } catch (error: any) {
        console.error('Failed to send notification to doctor:', error.message);
      }
    }

    // Send notification to patient
    if (this.notificationsService && prescription.patient) {
      try {
        await this.notificationsService.create({
          userId: prescription.patient.id,
          type: NotificationType.PRESCRIPTION_READY,
          priority: NotificationPriority.MEDIUM,
          title: 'Prescription Update - Items Unavailable',
          message: `Your prescription was returned to your doctor because some items are not available at the pharmacy. Your doctor will be notified and may provide an alternative prescription.`,
          relatedPrescriptionId: prescriptionId,
          metadata: {
            reason,
            missingItems,
            action: 'contact_doctor',
          } as any,
        });
      } catch (error: any) {
        console.error('Failed to send notification to patient:', error.message);
      }
    }

    return {
      ...updatedPrescription,
      message: 'Prescription rejected and returned to doctor. Notifications sent to doctor and patient.',
    };
  }

  // 9. Drug Demand Analytics
  async getDrugDemandAnalytics(pharmacyId?: string, days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const where: any = { createdAt: { gte: startDate } };
    if (pharmacyId) where.pharmacyId = pharmacyId;

    const prescriptions = await this.prisma.prescription.findMany({
      where,
      include: {
        doctor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    
    const drugDemand: Record<string, {
      count: number;
      byCondition: Record<string, number>;
      byDoctor: Record<string, number>;
    }> = {};

    prescriptions.forEach((pres) => {
      const medications = pres.medications as any[];
      medications?.forEach((med: any) => {
        const key = med.name;
        if (!drugDemand[key]) {
          drugDemand[key] = { count: 0, byCondition: {}, byDoctor: {} };
        }
        drugDemand[key].count++;
        
        if (pres.diagnosis) {
          drugDemand[key].byCondition[pres.diagnosis] = 
            (drugDemand[key].byCondition[pres.diagnosis] || 0) + 1;
        }
        
        if (pres.doctor) {
          const doctorName = `${pres.doctor.firstName} ${pres.doctor.lastName}`;
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
