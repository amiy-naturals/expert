import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function AdminSettings() {
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/admin/settings')
      .then((d) => setForm(d))
      .catch((e) => setError((e as Error).message));
  }, []);

  function update<K extends string>(key: K, val: number) {
    setForm((f: any) => ({ ...f, [key]: val }));
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      await apiFetch('/admin/settings', { method: 'POST', body: JSON.stringify(form) });
      alert('Settings saved');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!form && !error) return <div>Loading…</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card title="Loyalty">
          <Field label="Points per ₹" value={form.loyalty_point_per_rupee} onChange={(v) => update('loyalty_point_per_rupee', v)} />
          <Field label="Max Redemption % (0-1)" value={form.loyalty_max_redemption_pct} onChange={(v) => update('loyalty_max_redemption_pct', v)} />
        </Card>
        <Card title="Referral Rates">
          <Field label="Level 1 % (0-1)" value={form.referral_level1_rate} onChange={(v) => update('referral_level1_rate', v)} />
          <Field label="Level 2 % (0-1)" value={form.referral_level2_rate} onChange={(v) => update('referral_level2_rate', v)} />
          <Field label="Level 3 % (0-1)" value={form.referral_level3_rate} onChange={(v) => update('referral_level3_rate', v)} />
        </Card>
        <Card title="Doctor Commission">
          <Field label="Min (0-1)" value={form.doctor_commission_min} onChange={(v) => update('doctor_commission_min', v)} />
          <Field label="Max (0-1)" value={form.doctor_commission_max} onChange={(v) => update('doctor_commission_max', v)} />
        </Card>
      </div>
      <div className="mt-6">
        <button disabled={saving} onClick={onSave} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:opacity-90">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: any }) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input type="number" step="any" value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
    </div>
  );
}
