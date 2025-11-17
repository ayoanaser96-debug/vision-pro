/**
 * Example usage of BillingPanel component
 * This file demonstrates various integration patterns
 */

'use client';

import { useState, useEffect } from 'react';
import { BillingPanel } from '@/components/BillingPanel';
import { BillingHistory, Invoice } from '@/types/billing';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';

/**
 * Example 1: Basic Usage
 * Minimal implementation with just billing display
 */
export function BasicBillingExample() {
  const [billingHistory, setBillingHistory] = useState<BillingHistory | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      const response = await api.get('/patients/billing-history');
      setBillingHistory(response.data);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    }
  };

  return (
    <BillingPanel
      billingHistory={billingHistory}
      onRefresh={loadBillingData}
      patientName={`${user?.firstName} ${user?.lastName}`}
    />
  );
}

/**
 * Example 2: With Payment Integration
 * Includes payment handling functionality
 */
export function BillingWithPaymentExample() {
  const [billingHistory, setBillingHistory] = useState<BillingHistory | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      const response = await api.get('/patients/billing-history');
      setBillingHistory(response.data);
    } catch (error) {
      console.error('Failed to load billing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load billing history',
        variant: 'destructive',
      });
    }
  };

  const handlePayment = async (invoice: Invoice) => {
    try {
      // Show loading state
      toast({
        title: 'Processing Payment',
        description: 'Please wait...',
      });

      // Process payment
      const response = await api.post('/billing/payment', {
        patientId: user?.id,
        invoiceId: invoice.id,
        amount: invoice.amount,
        description: invoice.description,
      });

      // Show success
      toast({
        title: 'Payment Successful',
        description: `Paid $${invoice.amount.toFixed(2)} for ${invoice.description}`,
      });

      // Refresh billing data
      await loadBillingData();
    } catch (error: any) {
      console.error('Payment failed:', error);
      toast({
        title: 'Payment Failed',
        description: error.response?.data?.message || 'Unable to process payment',
        variant: 'destructive',
      });
    }
  };

  return (
    <BillingPanel
      billingHistory={billingHistory}
      onRefresh={loadBillingData}
      onPayment={handlePayment}
      patientName={`${user?.firstName} ${user?.lastName}`}
    />
  );
}

/**
 * Example 3: In a Dashboard Tab
 * Shows integration within a tabbed interface
 */
export function DashboardBillingExample() {
  const [billingHistory, setBillingHistory] = useState<BillingHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/patients/billing-history');
      setBillingHistory(response.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load billing data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (invoice: Invoice) => {
    try {
      await api.post('/billing/payment', {
        patientId: user?.id,
        amount: invoice.amount,
        invoiceId: invoice.id,
      });

      toast({
        title: 'Success',
        description: 'Payment processed successfully',
      });

      loadAllData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Payment processing failed',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <BillingPanel
        billingHistory={billingHistory}
        onRefresh={loadAllData}
        onPayment={handlePayment}
        patientName={`${user?.firstName} ${user?.lastName}`}
      />
    </div>
  );
}

/**
 * Example 4: With Mock Data (for testing)
 * Demonstrates component with sample data
 */
export function BillingWithMockDataExample() {
  const mockBillingHistory: BillingHistory = {
    invoices: [
      {
        id: 'inv-001',
        transactionId: 'TXN-APT-12345678',
        date: new Date('2025-11-15'),
        amount: 100,
        status: 'paid',
        description: 'Consultation with Dr. Smith',
        type: 'appointment',
        items: [
          { name: 'Consultation', price: 100, quantity: 1 }
        ]
      },
      {
        id: 'inv-002',
        transactionId: 'TXN-RX-87654321',
        date: new Date('2025-11-10'),
        amount: 175,
        status: 'paid',
        description: 'Prescription from Dr. Johnson',
        type: 'prescription',
        items: [
          { name: 'Progressive Lenses', price: 150, quantity: 1 },
          { name: 'Anti-glare Coating', price: 25, quantity: 1 }
        ]
      },
      {
        id: 'inv-003',
        transactionId: 'TXN-APT-11223344',
        date: new Date('2025-11-17'),
        amount: 100,
        status: 'pending',
        description: 'Follow-up Consultation',
        type: 'appointment',
        items: [
          { name: 'Follow-up Visit', price: 100, quantity: 1 }
        ]
      }
    ],
    summary: {
      totalInvoices: 3,
      totalAmount: 375,
      pendingAmount: 100
    }
  };

  const handlePayment = (invoice: Invoice) => {
    console.log('Processing payment for:', invoice);
    alert(`Payment of $${invoice.amount} initiated`);
  };

  return (
    <BillingPanel
      billingHistory={mockBillingHistory}
      onRefresh={() => console.log('Refresh clicked')}
      onPayment={handlePayment}
      patientName="John Doe"
    />
  );
}

/**
 * Example 5: Standalone Billing Page
 * Full page implementation
 */
export default function BillingPage() {
  const [billingHistory, setBillingHistory] = useState<BillingHistory | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadBillingHistory();
    }
  }, [user]);

  const loadBillingHistory = async () => {
    try {
      const response = await api.get('/patients/billing-history');
      setBillingHistory(response.data);
    } catch (error) {
      console.error('Failed to load billing history:', error);
    }
  };

  const handlePayment = async (invoice: Invoice) => {
    try {
      const response = await api.post('/billing/payment', {
        patientId: user?.id,
        amount: invoice.amount,
        invoiceId: invoice.id,
        description: invoice.description,
      });

      toast({
        title: 'Payment Successful',
        description: `Transaction ${response.data.transactionId} completed`,
      });

      loadBillingHistory();
    } catch (error: any) {
      toast({
        title: 'Payment Failed',
        description: error.response?.data?.message || 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Billing & Payments</h1>
        <p className="text-muted-foreground">
          View your billing history and download receipts
        </p>
      </div>

      <BillingPanel
        billingHistory={billingHistory}
        onRefresh={loadBillingHistory}
        onPayment={handlePayment}
        patientName={`${user?.firstName} ${user?.lastName}`}
      />
    </div>
  );
}


