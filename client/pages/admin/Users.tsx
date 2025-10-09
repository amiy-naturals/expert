import { useEffect, useState } from 'react';
import { AdminAPI } from '@/lib/api';
import { getUser } from '@/lib/auth';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    AdminAPI.listUsers()
      .then((d: any[]) => setUsers(d))
      .catch((e) => alert(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const me = getUser();
  const isSuper = me?.role === 'super_admin';

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-semibold">Admin - Users</h1>
      {loading && <div>Loading...</div>}
      <div className="mt-4 grid gap-3">
        {users.map((u) => (
          <div key={u.id} className="rounded border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{u.name || u.email}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
                <div className="text-xs">Role: {u.role}</div>
                <div className="text-xs">Avatar approved: {u.avatar_approved ? 'Yes' : 'No'}</div>
              </div>
              <div className="flex items-center gap-2">
                {isSuper && (
                  <button
                    className="rounded border px-2 py-1 text-sm"
                    onClick={() => {
                      const next = u.role === 'admin' ? 'user' : 'admin';
                      AdminAPI.setRole(u.id, next).then(() => window.location.reload());
                    }}
                  >
                    Toggle Admin
                  </button>
                )}
                <button
                  className="rounded border px-2 py-1 text-sm"
                  onClick={() => {
                    AdminAPI.approveAvatar(u.id).then(() => window.location.reload());
                  }}
                >
                  Approve Avatar
                </button>
                {isSuper && (
                  <button
                    className="rounded border px-2 py-1 text-sm text-red-600"
                    onClick={() => {
                      fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' }).then(() => window.location.reload());
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
