import { useState } from 'react';
import { AdminAPI } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SuperAdminPanel() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    name: '',
  });

  const me = getUser();

  if (me?.role !== 'super_admin') {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">
            Only super_admin users can access this page.
          </p>
        </div>
      </div>
    );
  }

  const handleCreateSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.email.trim()) {
      toast.error('Email is required');
      return;
    }

    setLoading(true);
    try {
      const result = await AdminAPI.createSuperAdmin({
        email: form.email.trim(),
        name: form.name.trim() || form.email.trim(),
      });

      toast.success(`Super admin created: ${result.email}`);
      setForm({ email: '', name: '' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create super admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Super Admin Panel</h1>
        <p className="text-muted-foreground mb-8">
          Create new super admin accounts. Super admins have full access including user management and admin creation.
        </p>

        <div className="bg-card border rounded-lg p-6 space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>⚠️ Warning:</strong> Super admins have unrestricted access. Only create super admin accounts for trusted administrators.
            </p>
          </div>

          <form onSubmit={handleCreateSuperAdmin} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Email Address *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="admin@example.com"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Name (Optional)</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Admin Name"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !form.email.trim()}
            >
              {loading ? 'Creating...' : 'Create Super Admin'}
            </Button>
          </form>

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">Super Admin Permissions</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Create and manage other super admins</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Promote/demote regular admins</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Approve and reject user avatars</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Verify and revoke professional licenses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Approve and reject reviews</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Delete user accounts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Manage system settings and configurations</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
