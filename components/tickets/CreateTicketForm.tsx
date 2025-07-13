'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { QrCode, Camera, AlertTriangle, Clock, CheckCircle, Building2 } from 'lucide-react';
import { classifyIssue, calculateSLADeadline } from '@/lib/mockData';
import { useRef } from 'react';

export default function CreateTicketForm() {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [qrAssetId, setQrAssetId] = useState('');
  const [classification, setClassification] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<any>(null);
  const router = useRouter();
  const { data: session } = useSession();
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (value.length > 10) {
      const result = classifyIssue(value);
      setClassification(result);
    } else {
      setClassification(null);
    }
  };

  const handleQRScan = () => {
    // Mock QR scan - in real app would use camera
    const mockAssetIds = ['FRZ-A5-001', 'POS-CL3-002', 'LGT-P12-003', 'HVAC-ST-004'];
    const randomAsset = mockAssetIds[Math.floor(Math.random() * mockAssetIds.length)];
    setQrAssetId(randomAsset);
    
    // Auto-fill location based on asset
    if (randomAsset.includes('FRZ')) setLocation('Frozen Foods Section');
    else if (randomAsset.includes('POS')) setLocation('Checkout Area');
    else if (randomAsset.includes('LGT')) setLocation('Produce Section');
    else if (randomAsset.includes('HVAC')) setLocation('Store Interior');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    setImagePreviews(files.map(file => URL.createObjectURL(file)));
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newImages.map(file => URL.createObjectURL(file)));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare the payload for the API
      const ticketPayload = {
        description: description,
        location_in_store: location,
        qr_asset_id: qrAssetId || undefined
      };

      console.log('Submitting ticket payload:', ticketPayload);

      // Call the real API endpoint
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create ticket');
      }

      const result = await response.json();
      console.log('Ticket created successfully:', result);

      setCreatedTicket(result.ticket);
      setSubmitted(true);
      setIsSubmitting(false);

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/store/tickets');
      }, 3000);

    } catch (error) {
      console.error('Error creating ticket:', error);
      setIsSubmitting(false);
      // You could add error state handling here
      alert('Failed to create ticket. Please try again.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Created Successfully!</h2>
          <p className="text-gray-600 mb-4">Your issue has been reported and assigned to a technician.</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600">Ticket ID: <span className="font-mono font-semibold">#{createdTicket?.id || 'TKT-' + Date.now().toString().slice(-6)}</span></p>
            {createdTicket?.ai_priority && (
              <p className="text-sm text-gray-600 mt-1">
                Priority: <Badge className={getPriorityColor(createdTicket.ai_priority.toLowerCase())}>{createdTicket.ai_priority}</Badge>
              </p>
            )}
            {createdTicket?.assigned && (
              <p className="text-sm text-green-600 mt-1">
                ✓ Assigned to technician
              </p>
            )}
          </div>
          <p className="text-sm text-gray-500">Redirecting to your tickets...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Report New Issue
        </CardTitle>
        <CardDescription>
          Describe the problem you&apos;re experiencing and we&apos;ll route it to the right technician
        </CardDescription>
        {/* Store Information */}
        {session?.user?.store && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <Building2 className="h-4 w-4" />
              <span className="font-medium">{session.user.store.name}</span>
              <span>•</span>
              <span>{session.user.store.city}, {session.user.store.state}</span>
              <span>•</span>
              <span className="text-xs">Store ID: {session.user.store.store_id}</span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* QR Code Scanner */}
          <div className="space-y-2">
            <Label>Asset Identification (Optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Scan QR code or enter asset ID"
                value={qrAssetId}
                onChange={(e) => setQrAssetId(e.target.value)}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleQRScan}>
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR
              </Button>
            </div>
            {qrAssetId && (
              <div className="text-sm text-green-600 font-medium">
                ✓ Asset identified: {qrAssetId}
              </div>
            )}
          </div>

          {/* Problem Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Problem Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue in detail (e.g., Freezer in Aisle 5 is not cooling properly, temperature reading 35°F)"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              rows={4}
              required
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              {description.length}/500 characters. Be specific for better AI classification.
            </p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location in Store *</Label>
            <Input
              id="location"
              placeholder="e.g., Aisle 5, Checkout Lane 3, Produce Section"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="images">Attach Images (up to 5)</Label>
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleImageChange}
              disabled={images.length >= 5}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {imagePreviews.map((src, idx) => (
                <div key={idx} className="relative w-20 h-20 border rounded overflow-hidden">
                  <img src={src} alt={`Preview ${idx + 1}`} className="object-cover w-full h-full" />
                  <button
                    type="button"
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-bl px-1 text-xs"
                    onClick={() => handleRemoveImage(idx)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">You can upload up to 5 images. Only image files are allowed.</p>
          </div>

          {/* AI Classification Preview */}
          {classification && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-blue-900">AI Classification Preview:</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      {classification.category}
                    </Badge>
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      {classification.subcategory}
                    </Badge>
                    <Badge className={getPriorityColor(classification.priority)}>
                      {classification.priority.toUpperCase()} Priority
                    </Badge>
                  </div>
                  <p className="text-sm text-blue-700">
                    Confidence: {Math.round(classification.confidence * 100)}%
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* SLA Information */}
          {classification && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">Expected Response Time:</p>
                <p className="text-sm text-gray-600">
                  {classification.priority === 'high' && 'Within 4 hours (High Priority)'}
                  {classification.priority === 'medium' && 'Within 12 hours (Medium Priority)'}
                  {classification.priority === 'low' && 'Within 48 hours (Low Priority)'}
                </p>
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
            disabled={isSubmitting || !description.trim() || !location.trim()}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Creating Ticket & Assigning Technician...
              </>
            ) : (
              'Create Ticket'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}