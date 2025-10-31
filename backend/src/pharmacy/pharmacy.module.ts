import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PharmacyController } from './pharmacy.controller';
import { PharmacyService } from './pharmacy.service';
import { PharmacyEnhancedService } from './pharmacy-enhanced.service';
import { PrescriptionsModule } from '../prescriptions/prescriptions.module';
import { Prescription, PrescriptionSchema } from '../prescriptions/schemas/prescription.schema';
import { InventoryItem, InventoryItemSchema } from './schemas/inventory-item.schema';
import { Supplier, SupplierSchema } from './schemas/supplier.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Prescription.name, schema: PrescriptionSchema },
      { name: InventoryItem.name, schema: InventoryItemSchema },
      { name: Supplier.name, schema: SupplierSchema },
    ]),
    PrescriptionsModule,
  ],
  controllers: [PharmacyController],
  providers: [PharmacyService, PharmacyEnhancedService],
  exports: [PharmacyEnhancedService],
})
export class PharmacyModule {}

