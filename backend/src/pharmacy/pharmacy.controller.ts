import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { PharmacyEnhancedService } from './pharmacy-enhanced.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('pharmacy')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('pharmacy', 'admin')
export class PharmacyController {
  constructor(
    private readonly pharmacyService: PharmacyService,
    private readonly pharmacyEnhancedService: PharmacyEnhancedService,
  ) {}

  @Get('prescriptions')
  async getPrescriptions(@Request() req) {
    // For pharmacy users, get prescriptions assigned to them
    // For admin, get all pending prescriptions
    if (req.user.role === 'admin') {
      return this.pharmacyService.getAllPendingPrescriptions();
    }
    return this.pharmacyEnhancedService.getPrescriptionsForPharmacy(req.user.id);
  }

  @Get('prescriptions/:id/qr')
  async getPrescriptionQR(@Param('id') id: string) {
    return { qrCode: await this.pharmacyEnhancedService.generatePrescriptionQR(id) };
  }

  @Post('prescriptions/:id/validate')
  async validatePrescription(@Param('id') id: string, @Body() body: { patientHistory?: any }) {
    return this.pharmacyEnhancedService.validatePrescription(id, body.patientHistory);
  }

  @Put('prescriptions/:id/status')
  async updatePrescriptionStatus(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
  ) {
    return this.pharmacyEnhancedService.updatePrescriptionStatus(id, body.status, body.notes);
  }

  @Put('prescriptions/:id/fill')
  async fillPrescription(@Param('id') id: string, @Body() body: { notes?: string }) {
    return this.pharmacyService.fillPrescription(id, body.notes);
  }

  // AI & Automation
  @Get('prescriptions/:id/ai-suggestions')
  async getAIDrugSuggestions(@Param('id') id: string) {
    return this.pharmacyEnhancedService.getAIDrugSuggestions(id);
  }

  @Get('stock-forecast')
  async getStockForecast(@Query('days') days?: number) {
    return this.pharmacyEnhancedService.getStockForecast(days ? parseInt(days.toString()) : 30);
  }

  // Inventory Management
  @Get('inventory')
  async getInventory(@Request() req) {
    return this.pharmacyEnhancedService.getInventory(req.user.id);
  }

  @Get('inventory/low-stock')
  async getLowStockItems(@Request() req) {
    return this.pharmacyEnhancedService.getLowStockItems(req.user.id);
  }

  @Get('inventory/expiring-soon')
  async getExpiringSoon(@Request() req, @Query('days') days?: number) {
    return this.pharmacyEnhancedService.getExpiringSoon(
      days ? parseInt(days.toString()) : 30,
      req.user.id,
    );
  }

  @Post('inventory')
  async createInventoryItem(@Request() req, @Body() itemData: any) {
    return this.pharmacyEnhancedService.createInventoryItem({
      ...itemData,
      pharmacyId: req.user.id,
    });
  }

  @Put('inventory/:id')
  async updateInventoryItem(@Param('id') id: string, @Body() update: any) {
    return this.pharmacyEnhancedService.updateInventory(id, update);
  }

  // Supplier Management
  @Get('suppliers')
  async getSuppliers(@Request() req) {
    return this.pharmacyEnhancedService.getSuppliers(req.user.id);
  }

  @Post('suppliers')
  async createSupplier(@Request() req, @Body() supplierData: any) {
    return this.pharmacyEnhancedService.createSupplier({
      ...supplierData,
      pharmacyId: req.user.id,
    });
  }

  @Put('suppliers/:id/rating')
  async updateSupplierRating(@Param('id') id: string, @Body() rating: any) {
    return this.pharmacyEnhancedService.updateSupplierRating(id, rating);
  }

  // Delivery & Logistics
  @Post('prescriptions/:id/delivery')
  async createDeliveryOrder(@Param('id') id: string, @Body() deliveryData: any) {
    return this.pharmacyEnhancedService.createDeliveryOrder(id, deliveryData);
  }

  @Put('prescriptions/:id/delivery-status')
  async updateDeliveryStatus(
    @Param('id') id: string,
    @Body() body: { status: string; location?: string },
  ) {
    return this.pharmacyEnhancedService.updateDeliveryStatus(id, body.status, body.location);
  }

  // Analytics
  @Get('analytics')
  async getPharmacyAnalytics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.pharmacyEnhancedService.getPharmacyAnalytics(
      req.user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('analytics/drug-demand')
  async getDrugDemandAnalytics(@Request() req, @Query('days') days?: number) {
    return this.pharmacyEnhancedService.getDrugDemandAnalytics(
      req.user.id,
      days ? parseInt(days.toString()) : 30,
    );
  }
}
