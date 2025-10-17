import { useState, useRef } from 'react';
import { DoctorsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { compressImage, validateImage, validateLicense } from '@/lib/image-utils';
import { toast } from 'sonner';

export default function DoctorApplication() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [form, setForm] = useState({
    licenseNumber: '',
    licenseUrl: '',
    photoUrl: '',
  });

  const licenseInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleLicenseSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrors((prev) => ({ ...prev, license: '' }));

    try {
      await validateLicense(file);
      const url = URL.createObjectURL(file);
      setForm((prev) => ({ ...prev, licenseUrl: url }));
      toast.success('License uploaded successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload license';
      setErrors((prev) => ({ ...prev, license: message }));
      if (licenseInputRef.current) licenseInputRef.current.value = '';
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrors((prev) => ({ ...prev, photo: '' }));
    setLoading(true);

    try {
      await validateImage(file);
      const compressed = await compressImage(file);
      const url = URL.createObjectURL(compressed.blob);
      setForm((prev) => ({ ...prev, photoUrl: url }));
      toast.success(`Photo uploaded (${compressed.width}x${compressed.height}px, ${compressed.sizeKB}KB)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload photo';
      setErrors((prev) => ({ ...prev, photo: message }));
      if (photoInputRef.current) photoInputRef.current.value = '';
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!form.licenseNumber.trim()) newErrors.licenseNumber = 'License number is required';
    if (!form.licenseUrl) newErrors.license = 'License file is required';
    if (!form.photoUrl) newErrors.photo = 'Photo is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await DoctorsAPI.apply({
        license_number: form.licenseNumber,
        license_url: form.licenseUrl,
        photo_url: form.photoUrl,
      });

      toast.success('Application submitted successfully!');
      navigate('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit application';
      toast.error(message);
      setErrors((prev) => ({ ...prev, submit: message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Doctor Application</h1>
        <p className="text-muted-foreground mb-8">
          Submit your professional credentials for verification. Admins will review your application within 24 hours.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card border rounded-lg p-6">
          {/* License Number */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Medical License Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.licenseNumber}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, licenseNumber: e.target.value }));
                setErrors((prev) => ({ ...prev, licenseNumber: '' }));
              }}
              placeholder="e.g., BAMS/2024/12345"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.licenseNumber && (
              <p className="text-sm text-red-600">{errors.licenseNumber}</p>
            )}
          </div>

          {/* License Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Medical License (PDF) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                ref={licenseInputRef}
                type="file"
                accept=".pdf"
                onChange={handleLicenseSelect}
                disabled={loading}
                className="flex-1"
              />
              {form.licenseUrl && (
                <span className="text-sm text-green-600">✓ Uploaded</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload a PDF of your medical license. Maximum 20MB.
            </p>
            {errors.license && (
              <p className="text-sm text-red-600">{errors.license}</p>
            )}
          </div>

          {/* Professional Photo */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Professional Photo <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handlePhotoSelect}
                  disabled={loading}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, JPEG, PNG, or WebP. Maximum 10MB. Will be automatically resized.
                </p>
              </div>
              {form.photoUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={form.photoUrl}
                    alt="Profile"
                    className="w-16 h-16 rounded-md object-cover border"
                  />
                </div>
              )}
            </div>
            {errors.photo && (
              <p className="text-sm text-red-600">{errors.photo}</p>
            )}
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="font-semibold text-blue-900 mb-2">Verification Process:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Your application will be reviewed by our admin team</li>
              <li>Your photo must be a clear, professional headshot</li>
              <li>Your license document must be a valid PDF</li>
              <li>Once approved, you'll be able to post reviews and consultations</li>
            </ul>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
              {errors.submit}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !form.licenseNumber || !form.licenseUrl || !form.photoUrl}
            >
              {loading ? 'Processing...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
