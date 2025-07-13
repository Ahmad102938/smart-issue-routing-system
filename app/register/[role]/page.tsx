'use client';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Upload, ArrowLeft, ArrowRight, User, Building2, FileText, Eye } from 'lucide-react';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const stepsByRole: Record<string, { title: string; icon: React.ReactNode; description: string }[]> = {
  store: [
    { title: 'Account Info', icon: <User className="w-4 h-4" />, description: 'Basic account details' },
    { title: 'Store Details', icon: <Building2 className="w-4 h-4" />, description: 'Store information' },
    { title: 'Documents', icon: <FileText className="w-4 h-4" />, description: 'Upload required documents' },
    { title: 'Review', icon: <Eye className="w-4 h-4" />, description: 'Review your information' }
  ],
  provider: [
    { title: 'Account Info', icon: <User className="w-4 h-4" />, description: 'Basic account details' },
    { title: 'Provider Details', icon: <Building2 className="w-4 h-4" />, description: 'Company information' },
    { title: 'Documents', icon: <FileText className="w-4 h-4" />, description: 'Upload required documents' },
    { title: 'Review', icon: <Eye className="w-4 h-4" />, description: 'Review your information' }
  ],
  moderator: [
    { title: 'Account Info', icon: <User className="w-4 h-4" />, description: 'Basic account details' },
    { title: 'Review', icon: <Eye className="w-4 h-4" />, description: 'Review your information' }
  ],
  admin: [
    { title: 'Account Info', icon: <User className="w-4 h-4" />, description: 'Basic account details' },
    { title: 'Review', icon: <Eye className="w-4 h-4" />, description: 'Review your information' }
  ]
};

export default function RegisterRolePage() {
  const router = useRouter();
  const params = useParams();
  const role = (params?.role as string) || '';

  const [form, setForm] = useState<any>({});
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(0);

  const steps = stepsByRole[role] || [];

  // Security: Hide admin/moderator registration in production
  if (IS_PRODUCTION && (role === 'admin' || role === 'moderator')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">Registration Restricted</CardTitle>
            <CardDescription className="text-gray-600">
              Admin and Moderator registration is not available publicly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files).slice(0, 5);
    setFiles(selected);
  };

  const validate = () => {
    if (steps[step].title === 'Account Info') {
      if (!form.username || form.username.length < 3) return 'Username is required (min 3 chars)';
      if (!form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return 'Valid email is required';
      if (!form.password || form.password.length < 8) return 'Password is required (min 8 chars)';
    }
    if (steps[step].title === 'Store Details') {
      if (!form.store_name) return 'Store name is required';
      if (!form.store_id) return 'Store ID is required';
      if (!form.address) return 'Address is required';
      if (!form.city) return 'City is required';
      if (!form.state) return 'State is required';
      if (!form.zip_code) return 'Zip code is required';
      if (!form.latitude || isNaN(Number(form.latitude))) return 'Latitude is required';
      if (!form.longitude || isNaN(Number(form.longitude))) return 'Longitude is required';
    }
    if (steps[step].title === 'Provider Details') {
      if (!form.company_name) return 'Company name is required';
      if (!form.unique_company_id) return 'Company ID is required';
      if (!form.address) return 'Address is required';
      if (!form.latitude || isNaN(Number(form.latitude))) return 'Latitude is required';
      if (!form.longitude || isNaN(Number(form.longitude))) return 'Longitude is required';
      if (!form.skills) return 'At least one skill is required';
      if (!form.capacity_per_day || isNaN(Number(form.capacity_per_day))) return 'Capacity per day is required';
    }
    if (steps[step].title === 'Documents') {
      if (files.length === 0) return 'Please upload at least one document/image';
    }
    return '';
  };

  const handleNext = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError('');
    setStep((s) => s - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'skills' && role === 'provider') {
          formData.append(key, (value as string).split(',').map((s: string) => s.trim()).join(','));
        } else {
          formData.append(key, String(value));
        }
      });
      const apiType = role === 'provider' ? 'service_provider' : role;
      formData.append('type', apiType);
      files.forEach((file) => formData.append('documents', file));
      
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setSuccess('Registration successful! Please wait for approval or sign in.');
      setTimeout(() => {
        router.push('/auth/signin');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const progress = ((step + 1) / steps.length) * 100;

  // Multi-step form fields
  let formFields = null;
  if (steps[step].title === 'Account Info') {
    formFields = (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            placeholder="Enter your username"
            onChange={handleChange}
            value={form.username || ''}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            onChange={handleChange}
            value={form.email || ''}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            onChange={handleChange}
            value={form.password || ''}
            required
          />
        </div>
      </div>
    );
  } else if (steps[step].title === 'Store Details') {
    formFields = (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="store_name">Store Name</Label>
            <Input
              id="store_name"
              name="store_name"
              placeholder="Enter store name"
              onChange={handleChange}
              value={form.store_name || ''}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store_id">Store ID</Label>
            <Input
              id="store_id"
              name="store_id"
              placeholder="Enter store ID"
              onChange={handleChange}
              value={form.store_id || ''}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            placeholder="Enter store address"
            onChange={handleChange}
            value={form.address || ''}
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              placeholder="City"
              onChange={handleChange}
              value={form.city || ''}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              name="state"
              placeholder="State"
              onChange={handleChange}
              value={form.state || ''}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip_code">Zip Code</Label>
            <Input
              id="zip_code"
              name="zip_code"
              placeholder="Zip Code"
              onChange={handleChange}
              value={form.zip_code || ''}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              name="latitude"
              type="number"
              step="any"
              placeholder="Enter latitude"
              onChange={handleChange}
              value={form.latitude || ''}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              name="longitude"
              type="number"
              step="any"
              placeholder="Enter longitude"
              onChange={handleChange}
              value={form.longitude || ''}
              required
            />
          </div>
        </div>
      </div>
    );
  } else if (steps[step].title === 'Provider Details') {
    formFields = (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              name="company_name"
              placeholder="Enter company name"
              onChange={handleChange}
              value={form.company_name || ''}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unique_company_id">Company ID</Label>
            <Input
              id="unique_company_id"
              name="unique_company_id"
              placeholder="Enter company ID"
              onChange={handleChange}
              value={form.unique_company_id || ''}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            placeholder="Enter company address"
            onChange={handleChange}
            value={form.address || ''}
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              name="latitude"
              type="number"
              step="any"
              placeholder="Enter latitude"
              onChange={handleChange}
              value={form.latitude || ''}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              name="longitude"
              type="number"
              step="any"
              placeholder="Enter longitude"
              onChange={handleChange}
              value={form.longitude || ''}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="skills">Skills (comma separated)</Label>
          <Input
            id="skills"
            name="skills"
            placeholder="e.g., Plumbing, Electrical, HVAC"
            onChange={handleChange}
            value={form.skills || ''}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity_per_day">Capacity per Day</Label>
          <Input
            id="capacity_per_day"
            name="capacity_per_day"
            type="number"
            placeholder="Enter daily capacity"
            onChange={handleChange}
            value={form.capacity_per_day || ''}
            required
          />
        </div>
      </div>
    );
  } else if (steps[step].title === 'Documents') {
    formFields = (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="documents">Upload Documents (up to 5)</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <Input
              id="documents"
              name="documents"
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="documents" className="cursor-pointer">
              <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
              <br />
              <span className="text-xs text-gray-500">Images and PDFs accepted</span>
            </label>
          </div>
        </div>
        {files.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Files</Label>
            <div className="flex flex-wrap gap-2">
              {files.map((file, idx) => (
                <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {file.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  } else if (steps[step].title === 'Review') {
    formFields = (
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Review Your Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(form).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <Label className="text-sm font-medium text-gray-600">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{String(value)}</p>
              </div>
            ))}
          </div>
          {files.length > 0 && (
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-600">Documents</Label>
              <div className="flex flex-wrap gap-2">
                {files.map((file, idx) => (
                  <Badge key={idx} variant="outline">
                    {file.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Register as {role.charAt(0).toUpperCase() + role.slice(1)}
          </h1>
          <p className="text-gray-600">Complete your registration in a few simple steps</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Step {step + 1} of {steps.length}</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2">
            {steps.map((s, idx) => (
              <div
                key={s.title}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  idx === step
                    ? 'bg-blue-600 text-white shadow-lg'
                    : idx < step
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {idx < step ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  s.icon
                )}
                <span className="hidden sm:inline">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {steps[step].icon}
              {steps[step].title}
            </CardTitle>
            <CardDescription>{steps[step].description}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={step === steps.length - 1 ? handleSubmit : handleNext} encType="multipart/form-data">
              {formFields}
              
              {error && (
                <Alert variant="destructive" className="mt-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="mt-6 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              <Separator className="my-6" />

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={step === 0}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Registering...
                    </>
                  ) : step === steps.length - 1 ? (
                    <>
                      Register
                      <CheckCircle className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
} 