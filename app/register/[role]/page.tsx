'use client';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const stepsByRole: Record<string, string[]> = {
  store: ['Account Info', 'Store Details', 'Documents', 'Review'],
  provider: ['Account Info', 'Provider Details', 'Documents', 'Review'],
  moderator: ['Account Info', 'Review'],
  admin: ['Account Info', 'Review']
};

export default function RegisterRolePage() {
  const router = useRouter();
  const params = useParams();
  const role = params.role as string;

  // All hooks must be called unconditionally
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50 p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Registration Restricted</h1>
        <p className="text-lg text-gray-700">Admin and Moderator registration is not available publicly.</p>
        <button className="mt-6 text-blue-600 underline" onClick={() => router.push('/')}>Back to Home</button>
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
    // Basic validation for all fields in the current step
    if (steps[step] === 'Account Info') {
      if (!form.username || form.username.length < 3) return 'Username is required (min 3 chars)';
      if (!form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return 'Valid email is required';
      if (!form.password || form.password.length < 8) return 'Password is required (min 8 chars)';
    }
    if (steps[step] === 'Store Details') {
      if (!form.store_name) return 'Store name is required';
      if (!form.store_id) return 'Store ID is required';
      if (!form.address) return 'Address is required';
      if (!form.city) return 'City is required';
      if (!form.state) return 'State is required';
      if (!form.zip_code) return 'Zip code is required';
      if (!form.latitude || isNaN(Number(form.latitude))) return 'Latitude is required';
      if (!form.longitude || isNaN(Number(form.longitude))) return 'Longitude is required';
    }
    if (steps[step] === 'Provider Details') {
      if (!form.company_name) return 'Company name is required';
      if (!form.unique_company_id) return 'Company ID is required';
      if (!form.address) return 'Address is required';
      if (!form.latitude || isNaN(Number(form.latitude))) return 'Latitude is required';
      if (!form.longitude || isNaN(Number(form.longitude))) return 'Longitude is required';
      if (!form.skills) return 'At least one skill is required';
      if (!form.capacity_per_day || isNaN(Number(form.capacity_per_day))) return 'Capacity per day is required';
    }
    if (steps[step] === 'Documents') {
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
      formData.append('type', role);
      files.forEach((file) => formData.append('documents', file));
      console.log(formData);
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

  // Multi-step form fields
  let formFields = null;
  if (steps[step] === 'Account Info') {
    formFields = (
      <>
        <label className="label">Username<input name="username" placeholder="Username" onChange={handleChange} value={form.username || ''} className="input" required /></label>
        <label className="label">Email<input name="email" type="email" placeholder="Email" onChange={handleChange} value={form.email || ''} className="input" required /></label>
        <label className="label">Password<input name="password" type="password" placeholder="Password" onChange={handleChange} value={form.password || ''} className="input" required /></label>
      </>
    );
  } else if (steps[step] === 'Store Details') {
    formFields = (
      <>
        <label className="label">Store Name<input name="store_name" placeholder="Store Name" onChange={handleChange} value={form.store_name || ''} className="input" required /></label>
        <label className="label">Store ID<input name="store_id" placeholder="Store ID" onChange={handleChange} value={form.store_id || ''} className="input" required /></label>
        <label className="label">Address<input name="address" placeholder="Address" onChange={handleChange} value={form.address || ''} className="input" required /></label>
        <label className="label">City<input name="city" placeholder="City" onChange={handleChange} value={form.city || ''} className="input" required /></label>
        <label className="label">State<input name="state" placeholder="State" onChange={handleChange} value={form.state || ''} className="input" required /></label>
        <label className="label">Zip Code<input name="zip_code" placeholder="Zip Code" onChange={handleChange} value={form.zip_code || ''} className="input" required /></label>
        <label className="label">Latitude<input name="latitude" placeholder="Latitude" onChange={handleChange} value={form.latitude || ''} className="input" required /></label>
        <label className="label">Longitude<input name="longitude" placeholder="Longitude" onChange={handleChange} value={form.longitude || ''} className="input" required /></label>
      </>
    );
  } else if (steps[step] === 'Provider Details') {
    formFields = (
      <>
        <label className="label">Company Name<input name="company_name" placeholder="Company Name" onChange={handleChange} value={form.company_name || ''} className="input" required /></label>
        <label className="label">Company ID<input name="unique_company_id" placeholder="Company ID" onChange={handleChange} value={form.unique_company_id || ''} className="input" required /></label>
        <label className="label">Address<input name="address" placeholder="Address" onChange={handleChange} value={form.address || ''} className="input" required /></label>
        <label className="label">Latitude<input name="latitude" placeholder="Latitude" onChange={handleChange} value={form.latitude || ''} className="input" required /></label>
        <label className="label">Longitude<input name="longitude" placeholder="Longitude" onChange={handleChange} value={form.longitude || ''} className="input" required /></label>
        <label className="label">Skills (comma separated)<input name="skills" placeholder="Skills" onChange={handleChange} value={form.skills || ''} className="input" required /></label>
        <label className="label">Capacity per day<input name="capacity_per_day" placeholder="Capacity per day" onChange={handleChange} value={form.capacity_per_day || ''} className="input" required /></label>
      </>
    );
  } else if (steps[step] === 'Documents') {
    formFields = (
      <>
        <label className="label">Upload Documents (up to 5)
          <input name="documents" type="file" accept="image/*,.pdf" multiple onChange={handleFileChange} className="input" />
        </label>
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {files.map((file, idx) => (
              <div key={idx} className="text-xs bg-gray-100 rounded px-2 py-1">{file.name}</div>
            ))}
          </div>
        )}
      </>
    );
  } else if (steps[step] === 'Review') {
    formFields = (
      <>
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Review Your Information</h2>
          <ul className="text-sm text-gray-700 space-y-1">
            {Object.entries(form).map(([key, value]) => (
              <li key={key}><strong>{key.replace(/_/g, ' ')}:</strong> {String(value)}</li>
            ))}
            {files.length > 0 && <li><strong>Documents:</strong> {files.map(f => f.name).join(', ')}</li>}
          </ul>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50 p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Register as {role.charAt(0).toUpperCase() + role.slice(1)}</h1>
      <div className="flex gap-2 mb-6">
        {steps.map((s, idx) => (
          <div key={s} className={`px-4 py-2 rounded-full text-sm font-semibold ${idx === step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{s}</div>
        ))}
      </div>
      <form onSubmit={step === steps.length - 1 ? handleSubmit : handleNext} encType="multipart/form-data" className="flex flex-col gap-4 w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        {formFields}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}
        <div className="flex gap-2 mt-4">
          {step > 0 && <button type="button" className="btn-secondary" onClick={handleBack}>Back</button>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Registering...' : step === steps.length - 1 ? 'Register' : 'Next'}
          </button>
        </div>
      </form>
      <button className="mt-6 text-blue-600 underline" onClick={() => router.push('/')}>Back to Home</button>
    </div>
  );
} 