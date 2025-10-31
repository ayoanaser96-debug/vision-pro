'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FaceCapture } from '@/components/face-capture';
import { DocumentScanner } from '@/components/document-scanner';
import { useToast } from '@/components/ui/use-toast';
import { Camera, Scan, User, Fingerprint } from 'lucide-react';
import api from '@/lib/api';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [showDocumentScanner, setShowDocumentScanner] = useState(false);
  const [capturedFace, setCapturedFace] = useState(false);
  const [scannedDocument, setScannedDocument] = useState<any>(null);
  const [formData, setFormData] = useState({
    identifier: '',
    email: '',
    phone: '',
    nationalId: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'patient',
    specialty: '',
  });
  const { login, register } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.identifier, formData.password);
        toast({ title: 'Success', description: 'Logged in successfully' });
        router.push('/');
      } else {
        const registrationData = { ...formData };
        
        // Include scanned document data if available
        if (scannedDocument?.extractedData) {
          // Auto-fill form with extracted data
          if (scannedDocument.extractedData.fullName) {
            const nameParts = scannedDocument.extractedData.fullName.split(/\s+/);
            if (nameParts.length >= 2) {
              registrationData.firstName = nameParts[0];
              registrationData.lastName = nameParts[nameParts.length - 1];
            }
          }
          if (scannedDocument.extractedData.documentNumber && !registrationData.nationalId) {
            registrationData.nationalId = scannedDocument.extractedData.documentNumber;
          }
        }

        await register(registrationData);
        
        // Register face if captured
        if (capturedFace) {
          try {
            await api.post('/biometric/face/register', {
              faceImage: capturedFace,
            });
            toast({ title: 'Success', description: 'Face registered successfully' });
          } catch (error) {
            console.error('Face registration failed:', error);
            // Continue even if face registration fails
          }
        }

        // Save document if scanned
        if (scannedDocument) {
          try {
            await api.post('/biometric/document/scan', {
              documentType: scannedDocument.documentType,
              frontImage: scannedDocument.frontImage,
              backImage: scannedDocument.backImage,
            });
            toast({ title: 'Success', description: 'Document saved successfully' });
          } catch (error) {
            console.error('Document save failed:', error);
            // Continue even if document save fails
          }
        }

        toast({ title: 'Success', description: 'Registered successfully' });
        router.push('/');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFaceCapture = async (imageData: string) => {
    setCapturedFace(imageData);
    setShowFaceCapture(false);
    
    if (isLogin) {
      // Try to recognize face for login
      try {
        const response = await api.post('/biometric/face/check-in', {
          faceImage: imageData,
        });

        if (response.data.success) {
          // Auto-login
          const user = response.data.user;
          localStorage.setItem('token', response.data.token || '');
          localStorage.setItem('user', JSON.stringify(user));
          toast({
            title: 'Face Recognized',
            description: `Welcome back, ${user.firstName}!`,
          });
          router.push(`/dashboard/${user.role}`);
        } else {
          toast({
            title: 'Face Not Recognized',
            description: 'Please use email/password login or register',
            variant: 'destructive',
          });
        }
      } catch (error: any) {
        toast({
          title: 'Recognition Failed',
          description: 'Please use email/password login',
          variant: 'destructive',
        });
      }
    } else {
      // For registration, just store the face image
      toast({
        title: 'Face Captured',
        description: 'Face will be registered after account creation',
      });
    }
  };

  const handleDocumentScan = (data: {
    documentType: string;
    frontImage: string;
    backImage?: string;
    extractedData?: any;
  }) => {
    setScannedDocument(data);
    setShowDocumentScanner(false);
    
    // Auto-fill form with extracted data
    if (data.extractedData) {
      if (data.extractedData.fullName) {
        const nameParts = data.extractedData.fullName.split(/\s+/);
        if (nameParts.length >= 2) {
          setFormData((prev) => ({
            ...prev,
            firstName: nameParts[0],
            lastName: nameParts[nameParts.length - 1],
          }));
        }
      }
      if (data.extractedData.documentNumber) {
        setFormData((prev) => ({
          ...prev,
          nationalId: data.extractedData.documentNumber,
        }));
      }
    }

    toast({
      title: 'Document Scanned',
      description: 'Information extracted and auto-filled',
    });
  };

  if (showFaceCapture) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-2xl">
          <FaceCapture
            mode={isLogin ? 'recognize' : 'register'}
            onCapture={handleFaceCapture}
            onCancel={() => setShowFaceCapture(false)}
          />
        </div>
      </div>
    );
  }

  if (showDocumentScanner && !isLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-2xl">
          <DocumentScanner
            onScanComplete={handleDocumentScan}
            onCancel={() => setShowDocumentScanner(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? 'Login' : 'Register'}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin
              ? 'Enter your credentials or use face recognition'
              : 'Create a new account with face recognition & document scanning'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Quick Actions */}
          {isLogin && (
            <div className="mb-4 space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowFaceCapture(true)}
              >
                <Camera className="h-4 w-4 mr-2" />
                Login with Face Recognition
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => router.push('/face-checkin')}
              >
                <Fingerprint className="h-4 w-4 mr-2" />
                Quick Check-In
              </Button>
            </div>
          )}

          {!isLogin && (
            <div className="mb-4 space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowDocumentScanner(true)}
              >
                <Scan className="h-4 w-4 mr-2" />
                Scan ID/Passport
              </Button>
              {scannedDocument && (
                <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                  <p className="font-medium text-green-800">✓ Document scanned</p>
                  <p className="text-xs text-green-600">
                    Information auto-filled below
                  </p>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isLogin ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email, Phone, or National ID</Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="Email, phone, or national ID"
                    value={formData.identifier}
                    onChange={(e) =>
                      setFormData({ ...formData, identifier: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationalId">National ID</Label>
                  <Input
                    id="nationalId"
                    value={formData.nationalId}
                    onChange={(e) =>
                      setFormData({ ...formData, nationalId: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="analyst">Analyst</option>
                    <option value="admin">Admin</option>
                    <option value="pharmacy">Pharmacy</option>
                  </select>
                </div>
                {formData.role === 'doctor' && (
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Specialty</Label>
                    <Input
                      id="specialty"
                      value={formData.specialty}
                      onChange={(e) =>
                        setFormData({ ...formData, specialty: e.target.value })
                      }
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </div>
              </>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
            </Button>

            {!isLogin && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowFaceCapture(true)}
              >
                <Camera className="h-4 w-4 mr-2" />
                {capturedFace ? 'Face Captured ✓' : 'Capture Face for Recognition'}
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setIsLogin(!isLogin);
                setCapturedFace(false);
                setScannedDocument(null);
                setShowFaceCapture(false);
                setShowDocumentScanner(false);
              }}
            >
              {isLogin
                ? "Don't have an account? Register"
                : 'Already have an account? Login'}
            </Button>
          </form>

          {/* Status Indicators */}
          {!isLogin && (capturedFace || scannedDocument) && (
            <div className="mt-4 space-y-2">
              {capturedFace && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm">
                  <Camera className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-800">Face captured - will be registered</span>
                </div>
              )}
              {scannedDocument && (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                  <Scan className="h-4 w-4 text-green-600" />
                  <span className="text-green-800">
                    {scannedDocument.documentType.replace('_', ' ')} scanned
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


