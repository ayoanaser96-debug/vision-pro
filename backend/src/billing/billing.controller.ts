import { Controller, Post, Body, UseGuards, Request, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('payment')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PATIENT')
  async processPayment(
    @Request() req,
    @Body() body: { patientId: string; amount: number; invoiceId?: string; description?: string },
  ) {
    const staffId = req.user.role?.toUpperCase() === 'ADMIN' ? req.user.id : undefined;
    return this.billingService.processPayment(
      body.patientId || req.user.id,
      body.amount,
      staffId,
      body.invoiceId,
      body.description,
    );
  }

  @Get('receipt/:transactionId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PATIENT')
  async getReceipt(
    @Param('transactionId') transactionId: string,
    @Request() req,
  ) {
    return this.billingService.getReceipt(transactionId, req.user.id);
  }

  @Get('receipt/:transactionId/download')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PATIENT')
  async downloadReceipt(
    @Param('transactionId') transactionId: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const receipt = await this.billingService.generateReceiptHTML(transactionId, req.user.id);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${transactionId}.html"`);
    res.send(receipt);
  }
}

