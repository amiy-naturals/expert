import { Outlet, Link } from 'react-router-dom';
import { getUser } from '@/lib/auth';

export default function AdminLayout() {
  const user = getUser();
  const isSuper = user?.role === 'super_admin';

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
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
