'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { ArrowLeft, Package, Save } from 'lucide-react';

export default function AddInventoryItemPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    manufacturer: '',
    stock: '',
    unit: 'tablets',
    expiryDate: '',
    batchNumber: '',
    lotNumber: '',
    purchasePrice: '',
    sellingPrice: '',
    reorderLevel: '',
    category: '',
    description: '',
    barcode: '',
    supplierId: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      const requiredFields = ['name', 'genericName', 'manufacturer', 'stock', 'unit', 'expiryDate', 'batchNumber', 'lotNumber', 'purchasePrice', 'sellingPrice'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData] || formData[field as keyof typeof formData] === '');

      if (missingFields.length > 0) {
        toast({
          title: 'Validation Error',
          description: `Please fill in all required fields: ${missingFields.join(', ')}`,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Prepare data for API
      const itemData: any = {
        name: formData.name,
        genericName: formData.genericName,
        manufacturer: formData.manufacturer,
        stock: parseInt(formData.stock),
        unit: formData.unit,
        expiryDate: new Date(formData.expiryDate),
        batchNumber: formData.batchNumber,
        lotNumber: formData.lotNumber,
        purchasePrice: parseFloat(formData.purchasePrice),
        sellingPrice: parseFloat(formData.sellingPrice),
      };

      // Add optional fields if provided
      if (formData.reorderLevel) {
        itemData.reorderLevel = parseInt(formData.reorderLevel);
      }
      if (formData.category) {
        itemData.category = formData.category;
      }
      if (formData.description) {
        itemData.description = formData.description;
      }
      if (formData.barcode) {
        itemData.barcode = formData.barcode;
      }
      if (formData.supplierId) {
        itemData.supplierId = formData.supplierId;
      }

      // Submit to API
      await api.post('/pharmacy/inventory', itemData);

      toast({
        title: 'Success',
        description: 'Medicine added to inventory successfully',
      });

      // Navigate back to pharmacy dashboard
      router.push('/dashboard/pharmacy');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add medicine to inventory',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/pharmacy')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="h-8 w-8 text-primary" />
              Add Medicine to Inventory
            </h1>
            <p className="text-muted-foreground mt-1">
              Add a new medicine to your pharmacy inventory
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Medicine Information</CardTitle>
            <CardDescription>Fill in the details to add a new medicine to inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Medicine Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Paracetamol 500mg"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="genericName">Generic Name *</Label>
                    <Input
                      id="genericName"
                      name="genericName"
                      value={formData.genericName}
                      onChange={handleChange}
                      placeholder="e.g., Acetaminophen"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Manufacturer *</Label>
                    <Input
                      id="manufacturer"
                      name="manufacturer"
                      value={formData.manufacturer}
                      onChange={handleChange}
                      placeholder="e.g., Bayer"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      placeholder="e.g., antibiotic, eye_drops, vitamins"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleChange}
                      placeholder="Scan or enter barcode"
                    />
                  </div>
                </div>
              </div>

              {/* Stock Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Stock Information</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="stock">Current Stock *</Label>
                    <Input
                      id="stock"
                      name="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={handleChange}
                      placeholder="e.g., 100"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit *</Label>
                    <select
                      id="unit"
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="tablets">Tablets</option>
                      <option value="ml">ML (Milliliters)</option>
                      <option value="drops">Drops</option>
                      <option value="bottles">Bottles</option>
                      <option value="boxes">Boxes</option>
                      <option value="pairs">Pairs</option>
                      <option value="vials">Vials</option>
                      <option value="units">Units</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reorderLevel">Reorder Level</Label>
                    <Input
                      id="reorderLevel"
                      name="reorderLevel"
                      type="number"
                      min="0"
                      value={formData.reorderLevel}
                      onChange={handleChange}
                      placeholder="e.g., 20"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum stock level before reordering
                    </p>
                  </div>
                </div>
              </div>

              {/* Batch & Expiry Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Batch & Expiry Information</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="batchNumber">Batch Number *</Label>
                    <Input
                      id="batchNumber"
                      name="batchNumber"
                      value={formData.batchNumber}
                      onChange={handleChange}
                      placeholder="e.g., BATCH-2024-001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lotNumber">Lot Number *</Label>
                    <Input
                      id="lotNumber"
                      name="lotNumber"
                      value={formData.lotNumber}
                      onChange={handleChange}
                      placeholder="e.g., LOT-2024-001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date *</Label>
                    <Input
                      id="expiryDate"
                      name="expiryDate"
                      type="date"
                      value={formData.expiryDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pricing Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="purchasePrice">Purchase Price *</Label>
                    <Input
                      id="purchasePrice"
                      name="purchasePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.purchasePrice}
                      onChange={handleChange}
                      placeholder="e.g., 5.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sellingPrice">Selling Price *</Label>
                    <Input
                      id="sellingPrice"
                      name="sellingPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.sellingPrice}
                      onChange={handleChange}
                      placeholder="e.g., 8.00"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Additional notes or description about this medicine..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierId">Supplier ID (Optional)</Label>
                  <Input
                    id="supplierId"
                    name="supplierId"
                    value={formData.supplierId}
                    onChange={handleChange}
                    placeholder="Enter supplier ID if available"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Adding...' : 'Add to Inventory'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/pharmacy')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

