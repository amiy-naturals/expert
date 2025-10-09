import React, { useState, useEffect } from 'react';
import { getUser } from '@/lib/auth';
import { DoctorsAPI } from '@/lib/api';

export default function DoctorApplicationCard() {
  const [user, setUser] = useState(getUser());
  const [application, setApplication] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseUrl, setLicenseUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUser(getUser());
    DoctorsAPI.myApplication()
      .then((d) => setApplication(d))
      .catch(() => {});
  }, []);

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
          <button className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={() => setOpen(true)}>
            Apply
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm">License number</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
          </div>
          <div>
            <label className="text-sm">License URL (uploaded file)</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={licenseUrl} onChange={(e) => setLicenseUrl(e.target.value)} />
          </div>
          <div>
            <label className="text-sm">Profile photo URL</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <button disabled={loading} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={submit}>
              {loading ? 'Submitting...' : 'Submit application'}
            </button>
            <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
