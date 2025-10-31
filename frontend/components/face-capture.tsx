'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CheckCircle, XCircle, RotateCcw, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { CameraPermissionHelper } from './camera-permission-helper';

interface FaceCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel?: () => void;
  mode?: 'register' | 'recognize';
  userId?: string;
}

export function FaceCapture({ onCapture, onCancel, mode = 'register', userId }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState(false);
  const [imageData, setImageData] = useState<string>('');
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Your browser does not support camera access. Please use a modern browser (Chrome, Firefox, Safari, or Edge).');
        toast({
          title: 'Browser Not Supported',
          description: 'Your browser does not support camera access. Please use Chrome, Firefox, Safari, or Edge.',
          variant: 'destructive',
        });
        return;
      }

      // Check permissions first (if supported)
      if (navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
          if (permissionStatus.state === 'denied') {
            setError('Camera access denied. Please enable camera permissions in your browser settings and refresh the page.');
            toast({
              title: 'Camera Permission Denied',
              description: 'Please enable camera permissions in your browser settings.',
              variant: 'destructive',
            });
            return;
          }
        } catch (permError) {
          // Permissions API not supported or failed, continue anyway
          console.log('Permissions API not available, proceeding...');
        }
      }

      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user', // Front-facing camera
        },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setError(''); // Clear any previous errors
      }
    } catch (err: any) {
      let errorMessage = 'Unable to access camera. ';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings and refresh the page.';
        toast({
          title: 'Camera Permission Denied',
          description: 'Please allow camera access and refresh the page. Check your browser address bar for the camera icon.',
          variant: 'destructive',
        });
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found. Please ensure a camera is connected.';
        toast({
          title: 'No Camera Found',
          description: 'No camera detected. Please connect a camera and try again.',
          variant: 'destructive',
        });
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application. Please close other apps using the camera.';
        toast({
          title: 'Camera In Use',
          description: 'Camera is being used by another application. Please close other apps and try again.',
          variant: 'destructive',
        });
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'Camera constraints not satisfied. Trying with default settings...';
        // Try again with less specific constraints
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true, // Just request any video stream
          });
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            setStream(mediaStream);
            setError('');
            return;
          }
        } catch (retryError: any) {
          errorMessage = 'Unable to access camera. Please check your camera settings.';
        }
      } else {
        errorMessage += err.message || 'Please check your camera permissions.';
        toast({
          title: 'Camera Error',
          description: err.message || 'Failed to access camera',
          variant: 'destructive',
        });
      }
      
      setError(errorMessage);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        // Convert to base64
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setImageData(imageDataUrl);
        setCaptured(true);
        stopCamera();
      }
    }
  };

  const retake = () => {
    setCaptured(false);
    setImageData('');
    startCamera();
  };

  const confirm = () => {
    if (imageData) {
      // Extract base64 data (remove data:image/jpeg;base64, prefix)
      const base64Data = imageData.split(',')[1];
      onCapture(base64Data);
    }
  };

  const cancel = () => {
    stopCamera();
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {mode === 'register' ? 'Register Face' : 'Face Recognition'}
        </CardTitle>
        <CardDescription>
          {mode === 'register'
            ? 'Position your face in the center and look directly at the camera'
            : 'Look at the camera for face recognition'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <>
            <CameraPermissionHelper
              onPermissionGranted={() => {
                setError('');
                startCamera();
              }}
            />
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          </>
        )}

        {!captured ? (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg border-2 border-dashed"
              style={{ maxHeight: '480px' }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-4 border-white rounded-full w-48 h-48 opacity-50" />
            </div>
          </div>
        ) : (
          <div className="relative">
            <img
              src={imageData}
              alt="Captured face"
              className="w-full rounded-lg border-2"
              style={{ maxHeight: '480px' }}
            />
            <div className="absolute top-2 right-2">
              <CheckCircle className="h-8 w-8 text-green-500 bg-white rounded-full" />
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-2">
          {!captured ? (
            <>
              <Button onClick={capturePhoto} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Capture Photo
              </Button>
              <Button variant="outline" onClick={cancel}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button onClick={confirm} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm
              </Button>
              <Button variant="outline" onClick={retake}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake
              </Button>
              <Button variant="outline" onClick={cancel}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Ensure good lighting</p>
          <p>• Face the camera directly</p>
          <p>• Remove glasses if possible</p>
          <p>• Keep a neutral expression</p>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
                <div className="text-xs text-red-700 space-y-2">
                  <p className="font-medium">How to enable camera permissions:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Chrome/Edge:</strong> Click the camera icon in the address bar → Allow</li>
                    <li><strong>Firefox:</strong> Click the camera icon in the address bar → Allow</li>
                    <li><strong>Safari:</strong> Safari → Settings → Websites → Camera → Allow</li>
                    <li><strong>Mobile:</strong> Settings → App Permissions → Camera → Allow</li>
                  </ul>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full border-red-300 text-red-700 hover:bg-red-100"
                    onClick={() => {
                      setError('');
                      startCamera();
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

