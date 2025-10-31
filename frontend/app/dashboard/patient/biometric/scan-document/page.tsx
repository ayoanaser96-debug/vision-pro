'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DocumentScanner } from '@/components/document-scanner';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { Scan, CheckCircle, ArrowLeft, FileText, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ScanDocumentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [scannedDocuments, setScannedDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await api.get('/biometric/document/my-documents');
      setScannedDocuments(res.data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanComplete = async (data: {
    documentType: string;
    frontImage: string;
    backImage?: string;
    extractedData?: any;
  }) => {
    try {
      await api.post('/biometric/document/scan', {
        documentType: data.documentType,
        frontImage: data.frontImage,
        backImage: data.backImage,
      });

      toast({
        title: 'Success',
        description: 'Document scanned and saved successfully',
      });

      loadDocuments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save document',
        variant: 'destructive',
      });
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/patient')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Scan className="h-8 w-8 text-primary" />
            ID / Passport Scanner
          </h1>
        </div>

        {/* Scanner Component */}
        <DocumentScanner
          onScanComplete={handleScanComplete}
          onCancel={() => router.push('/dashboard/patient')}
          userId={user?.id}
        />

        {/* Scanned Documents List */}
        {!loading && scannedDocuments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                My Scanned Documents
              </CardTitle>
              <CardDescription>Previously scanned ID cards and passports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scannedDocuments.map((doc: any) => (
                  <Card key={doc._id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge>{getDocumentTypeLabel(doc.documentType)}</Badge>
                            {doc.metadata?.verified && (
                              <Badge className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            <Badge variant="outline">
                              OCR: {Math.round((doc.ocrConfidence || 0) * 100)}%
                            </Badge>
                          </div>

                          {doc.extractedData && (
                            <div className="space-y-1 text-sm mt-2">
                              {doc.extractedData.fullName && (
                                <p>
                                  <span className="font-medium">Name:</span>{' '}
                                  {doc.extractedData.fullName}
                                </p>
                              )}
                              {doc.extractedData.documentNumber && (
                                <p>
                                  <span className="font-medium">Number:</span>{' '}
                                  {doc.extractedData.documentNumber}
                                </p>
                              )}
                              {doc.extractedData.dateOfBirth && (
                                <p>
                                  <span className="font-medium">DOB:</span>{' '}
                                  {doc.extractedData.dateOfBirth}
                                </p>
                              )}
                              {doc.extractedData.nationality && (
                                <p>
                                  <span className="font-medium">Nationality:</span>{' '}
                                  {doc.extractedData.nationality}
                                </p>
                              )}
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground mt-2">
                            Scanned: {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // View document image
                              window.open(doc.frontImage, '_blank');
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

