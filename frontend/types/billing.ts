/**
 * Type definitions for billing and invoice management
 */

export interface InvoiceItem {
  name: string;
  price: number;
  quantity?: number;
}

export interface Invoice {
  id: string;
  transactionId?: string;
  date: string | Date;
  amount: number;
  status: 'paid' | 'pending' | 'cancelled' | 'refunded';
  description: string;
  type?: 'appointment' | 'prescription' | 'service';
  items?: InvoiceItem[];
  paidAt?: string | Date;
}

export interface BillingSummary {
  totalInvoices: number;
  totalAmount: number;
  pendingAmount: number;
  paidAmount?: number;
}

export interface BillingHistory {
  invoices: Invoice[];
  summary?: BillingSummary;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  message?: string;
}


