import { useEffect, useState } from 'react';
import { AdminAPI } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setLoading(true);
    AdminAPI.listUsers()
      .then((d: any[]) => setUsers(d))
      .catch((e) => alert(String(e)))
      .finally(() => setLoading(false));
  };

  const me = getUser();
  const isSuper = me?.role === 'super_admin';

  const handleAction = async (action: () => Promise<any>, userId: string) => {
    setActionLoading(userId);
    try {
      await action();
      loadUsers();
    } catch (e) {
      alert(String(e));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-8">Admin - Users Management</h1>

      <div className="mb-4 p-4 bg-muted rounded-lg text-sm">
        <p className="font-semibold mb-2">Verification Workflow:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li><strong>Avatar Approved:</strong> User has submitted a valid profile picture (jpg, jpeg, png, webp)</li>
          <li><strong>License Verified:</strong> User has submitted a valid professional license (PDF)</li>
          <li><strong>Role:</strong> admin can approve content, super_admin can manage admins</li>
        </ul>
      </div>

      {loading && <div className="text-center py-8">Loading users...</div>}

      <div className="mt-6 space-y-4">
        {users.map((u) => (
          <div key={u.id} className="rounded border p-4 bg-card">
            <div className="grid gap-4 md:grid-cols-[1fr,auto]">
              <div className="space-y-3">
                <div>
                  <div className="font-semibold text-lg">{u.name || u.email}</div>
                  <div className="text-sm text-muted-foreground">{u.email}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant={u.role === 'super_admin' ? 'default' : u.role === 'admin' ? 'secondary' : 'outline'}>
                    {u.role || 'user'}
                  </Badge>
                  <Badge variant={u.avatar_approved ? 'default' : 'destructive'}>
                    Avatar: {u.avatar_approved ? '✓ Approved' : '✗ Pending'}
                  </Badge>
                  <Badge variant={u.license_verified ? 'default' : 'outline'}>
                    License: {u.license_verified ? '✓ Verified' : '◊ Not verified'}
                  </Badge>
                </div>

                {u.license_url && (
                  <div className="text-xs">
                    <a
                      href={u.license_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View License
                    </a>
                  </div>
                )}

                {u.photo_url && (
                  <div className="text-xs">
                    <a
                      href={u.photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Avatar
                    </a>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {isSuper && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const next = u.role === 'admin' ? 'user' : 'admin';
                      handleAction(() => AdminAPI.setRole(u.id, next), u.id);
                    }}
                    disabled={actionLoading === u.id}
                  >
                    {u.role === 'admin' ? 'Demote' : 'Promote Admin'}
                  </Button>
                )}

                {!u.avatar_approved ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      handleAction(() => AdminAPI.approveAvatar(u.id), u.id);
                    }}
                    disabled={actionLoading === u.id}
                  >
                    Approve Avatar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      handleAction(() => AdminAPI.rejectAvatar(u.id), u.id);
                    }}
                    disabled={actionLoading === u.id}
                  >
                    Reject Avatar
                  </Button>
                )}

                {!u.license_verified && u.license_url && (
                  <Button
                    size="sm"
                    onClick={() => {
                      handleAction(() => AdminAPI.verifyLicense(u.id), u.id);
                    }}
                    disabled={actionLoading === u.id}
                  >
                    Verify License
                  </Button>
                )}

                {u.license_verified && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleAction(() => AdminAPI.rejectLicense(u.id), u.id);
                    }}
                    disabled={actionLoading === u.id}
                  >
                    Revoke License
                  </Button>
                )}

                {isSuper && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm(`Delete user ${u.name || u.email}?`)) {
                        handleAction(() => AdminAPI.deleteUser(u.id), u.id);
                      }
                    }}
                    disabled={actionLoading === u.id}
                  >
                    Remove User
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
