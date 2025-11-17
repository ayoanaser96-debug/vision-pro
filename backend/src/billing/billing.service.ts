import { Injectable, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { PatientJourneyService } from '../patients/patient-journey.service';
import { PrismaService } from '../prisma/prisma.service';

export interface Receipt {
  transactionId: string;
  invoiceId?: string;
  patientId: string;
  patientName?: string;
  amount: number;
  description?: string;
  paidAt: Date;
  clinicName: string;
  clinicAddress: string;
}

@Injectable()
export class BillingService {
  private receipts: Map<string, Receipt> = new Map();

  constructor(
    @Inject(forwardRef(() => PatientJourneyService))
    private patientJourneyService: PatientJourneyService,
    private prisma: PrismaService,
  ) {}

  async processPayment(
    patientId: string,
    amount: number,
    staffId?: string,
    invoiceId?: string,
    description?: string,
  ) {
    // Process payment logic here
    // After successful payment, mark payment step as complete
    try {
      await this.patientJourneyService.markPaymentComplete(patientId, staffId);
    } catch (error) {
      // Journey might not exist yet, that's okay
      console.log('Journey update skipped:', error.message);
    }

    const transactionId = `TXN-${Date.now()}`;
    const paidAt = new Date();

    // Get patient info
    let patientName = 'Patient';
    try {
      const patient = await this.prisma.user.findUnique({
        where: { id: patientId },
        select: { firstName: true, lastName: true },
      });
      if (patient) {
        patientName = `${patient.firstName} ${patient.lastName}`;
      }
    } catch (error) {
      console.log('Could not fetch patient name:', error.message);
    }

    // Store receipt data
    const receipt: Receipt = {
      transactionId,
      invoiceId,
      patientId,
      patientName,
      amount,
      description: description || 'Medical Services',
      paidAt,
      clinicName: 'Vision Clinic',
      clinicAddress: '123 Medical Center, Healthcare City',
    };

    this.receipts.set(transactionId, receipt);

    return {
      success: true,
      transactionId,
      amount,
      paidAt,
      receiptUrl: `/billing/receipt/${transactionId}`,
    };
  }

  async getReceipt(transactionId: string, userId: string): Promise<Receipt> {
    const receipt = this.receipts.get(transactionId);
    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    // Verify user has access to this receipt
    if (receipt.patientId !== userId) {
      // Check if user is admin
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user?.role?.toUpperCase() !== 'ADMIN') {
        throw new NotFoundException('Receipt not found');
      }
    }

    return receipt;
  }

  async generateReceiptHTML(transactionId: string, userId: string): Promise<string> {
    const receipt = await this.getReceipt(transactionId, userId);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - ${receipt.transactionId}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            color: #333;
        }
        .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        .header p {
            font-size: 14px;
            opacity: 0.9;
        }
        .receipt-body {
            padding: 40px 30px;
        }
        .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 2px solid #f0f0f0;
        }
        .info-group {
            flex: 1;
        }
        .info-group h3 {
            color: #667eea;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
            font-weight: 600;
        }
        .info-group p {
            color: #555;
            line-height: 1.6;
            font-size: 14px;
        }
        .transaction-details {
            background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 15px 0;
            border-bottom: 1px solid #ddd;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            color: #666;
            font-weight: 500;
            font-size: 14px;
        }
        .detail-value {
            color: #333;
            font-weight: 600;
            font-size: 14px;
        }
        .amount-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 30px;
        }
        .amount-section h2 {
            font-size: 16px;
            margin-bottom: 10px;
            opacity: 0.9;
            font-weight: 500;
        }
        .amount {
            font-size: 48px;
            font-weight: 700;
            margin: 10px 0;
        }
        .paid-badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 10px;
        }
        .footer {
            text-align: center;
            padding: 30px;
            background: #f8f9fa;
            color: #666;
            font-size: 13px;
            line-height: 1.8;
        }
        .footer strong {
            color: #333;
        }
        .print-btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 20px;
            cursor: pointer;
            border: none;
            font-size: 14px;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .receipt-container {
                box-shadow: none;
                border-radius: 0;
            }
            .print-btn {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="header">
            <h1>💳 PAYMENT RECEIPT</h1>
            <p>Official Receipt for Medical Services</p>
        </div>

        <div class="receipt-body">
            <div class="info-section">
                <div class="info-group">
                    <h3>📍 Clinic Information</h3>
                    <p><strong>${receipt.clinicName}</strong></p>
                    <p>${receipt.clinicAddress}</p>
                    <p>Phone: +1 (555) 123-4567</p>
                    <p>Email: info@visionclinic.com</p>
                </div>
                <div class="info-group" style="text-align: right;">
                    <h3>👤 Patient Information</h3>
                    <p><strong>${receipt.patientName}</strong></p>
                    <p>Patient ID: ${receipt.patientId.substring(0, 8)}</p>
                    <p>Date: ${receipt.paidAt.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}</p>
                    <p>Time: ${receipt.paidAt.toLocaleTimeString('en-US')}</p>
                </div>
            </div>

            <div class="transaction-details">
                <div class="detail-row">
                    <span class="detail-label">Transaction ID</span>
                    <span class="detail-value">${receipt.transactionId}</span>
                </div>
                ${
                  receipt.invoiceId
                    ? `
                <div class="detail-row">
                    <span class="detail-label">Invoice ID</span>
                    <span class="detail-value">${receipt.invoiceId}</span>
                </div>`
                    : ''
                }
                <div class="detail-row">
                    <span class="detail-label">Description</span>
                    <span class="detail-value">${receipt.description}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payment Method</span>
                    <span class="detail-value">Credit Card / Bank Transfer</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payment Status</span>
                    <span class="detail-value" style="color: #22c55e;">✓ PAID</span>
                </div>
            </div>

            <div class="amount-section">
                <h2>Total Amount Paid</h2>
                <div class="amount">$${receipt.amount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}</div>
                <div class="paid-badge">✓ PAYMENT RECEIVED</div>
            </div>

            <div style="text-align: center;">
                <button class="print-btn" onclick="window.print()">🖨️ Print Receipt</button>
            </div>
        </div>

        <div class="footer">
            <p><strong>Thank you for choosing ${receipt.clinicName}!</strong></p>
            <p>This is an official computer-generated receipt and does not require a signature.</p>
            <p>For any queries, please contact us at info@visionclinic.com or call +1 (555) 123-4567</p>
            <p style="margin-top: 15px; color: #999;">Generated on ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }
}

