import { Outlet, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthUser, updateUser } from '@/lib/auth';
import { UsersAPI } from '@/lib/api';

export default function AdminLayout() {
  const user = useAuthUser();

  // If logged-in but missing role, fetch it from server
  useEffect(() => {
    (async () => {
      if (user && !user.role) {
        try {
          const me = await UsersAPI.me();
          if (me) {
            updateUser({
              role: me.role,
              avatar: (me as any).avatar ?? (me as any).photo_url,
              avatar_approved: (me as any).avatar_approved,
              clinic: (me as any).clinic,
              bio: (me as any).bio,
              name: me.name ?? user.name,
              email: me.email ?? user.email,
            });
          }
        } catch {}
      }
    })();
  }, [user?.id]);

  const isSuper = user?.role === 'super_admin';

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <h2>Loading…</h2>
        <p>Please wait.</p>
      </div>
    );
  }

  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return (
      <div className="container mx-auto py-8">
        <h2>Access denied</h2>
        <p>You must be an admin or super admin to view this area.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="container mx-auto py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="font-semibold hover:underline">Admin</Link>
            <Link to="/admin/users" className="text-sm text-muted-foreground hover:text-foreground">Users</Link>
            <Link to="/admin/applications" className="text-sm text-muted-foreground hover:text-foreground">Applications</Link>
            <Link to="/admin/reviews" className="text-sm text-muted-foreground hover:text-foreground">Reviews</Link>
            <Link to="/admin/settings" className="text-sm text-muted-foreground hover:text-foreground">Settings</Link>
            {isSuper && (
              <Link to="/admin/super-admin" className="text-sm text-muted-foreground hover:text-foreground font-medium">
                Super Admin
              </Link>
            )}
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Signed in as </span>
            <span className="font-semibold">{user.name}</span>
            <span className="text-xs ml-2 bg-primary/10 px-2 py-1 rounded">
              {isSuper ? 'Super Admin' : 'Admin'}
            </span>
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
