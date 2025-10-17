import React, { useState, useEffect } from 'react';
import { getUser } from '@/lib/auth';
import { DoctorsAPI, uploadImageAndGetUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function DoctorApplicationCard() {
  const [user, setUser] = useState(getUser());
  const [application, setApplication] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseUrl, setLicenseUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<{ license?: boolean; photo?: boolean }>({});

  useEffect(() => {
    setUser(getUser());
    DoctorsAPI.myApplication()
      .then((d) => setApplication(d))
      .catch(() => {});
  }, []);

  async function uploadAndSet(file: File, type: 'license' | 'photo') {
    setUploading((u) => ({ ...u, [type]: true }));
    try {
      const url = await uploadImageAndGetUrl(file);
      if (type === 'license') setLicenseUrl(url);
      else setPhotoUrl(url);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setUploading((u) => ({ ...u, [type]: false }));
    }
  }

  async function submit() {
    if (!user) return alert('Please sign in');
    if (!licenseNumber || !licenseUrl || !photoUrl) return alert('Please fill all fields');
    setLoading(true);
    try {
      const payload = { license_number: licenseNumber, license_url: licenseUrl, photo_url: photoUrl };
      await DoctorsAPI.apply(payload);
      alert('Application submitted.');
      setOpen(false);
      const app = await DoctorsAPI.myApplication();
      setApplication(app);
    } catch (err: any) {
      alert(String(err));
    } finally {
      setLoading(false);
    }
  }

  if (application?.status === 'approved') {
    return (
      <div className="rounded-2xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Amiy Doctor — Verified</div>
            <div className="text-sm text-muted-foreground">Application approved on {new Date(application.reviewed_at).toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    );
  }

  if (application?.status === 'pending') {
    return (
      <div className="rounded-2xl border bg-white p-4">
        <div className="font-semibold">Application pending</div>
        <div className="text-sm text-muted-foreground">Submitted {new Date(application.created_at).toLocaleDateString()}</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">Apply as Amiy Doctor</div>
          <div className="text-sm text-muted-foreground">Submit license and profile photo for verification.</div>
        </div>
        <div>
          <Button onClick={() => setOpen(true)}>Apply</Button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm">License number</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
          </div>
          <div>
            <label className="text-sm">Upload license</label>
            <input type="file" accept="image/*,application/pdf" className="mt-1 block w-full text-sm" onChange={(e) => e.target.files?.[0] && uploadAndSet(e.target.files[0], 'license')} />
            {uploading.license && <div className="text-xs text-muted-foreground mt-1">Uploading…</div>}
            {licenseUrl && <div className="text-xs mt-1">Uploaded ✓</div>}
          </div>
          <div>
            <label className="text-sm">Upload profile photo</label>
            <input type="file" accept="image/*" className="mt-1 block w-full text-sm" onChange={(e) => e.target.files?.[0] && uploadAndSet(e.target.files[0], 'photo')} />
            {uploading.photo && <div className="text-xs text-muted-foreground mt-1">Uploading…</div>}
            {photoUrl && <div className="text-xs mt-1">Uploaded ✓</div>}
          </div>
          <div className="flex items-center gap-2">
            <Button disabled={loading} onClick={submit}>
              {loading ? (
                <span className="inline-flex items-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />Submitting…</span>
              ) : (
                'Submit application'
              )}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
