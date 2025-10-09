import { Outlet, Link } from 'react-router-dom';
import { getUser } from '@/lib/auth';

export default function AdminLayout() {
  const user = getUser();
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
      <div className="container mx-auto py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="font-semibold">Admin</Link>
          <Link to="/admin/users" className="text-sm text-muted-foreground">Users</Link>
          <Link to="/admin/settings" className="text-sm text-muted-foreground">Settings</Link>
        </div>
        <div>Signed in as {user.name}</div>
      </div>
      <Outlet />
    </div>
  );
}
