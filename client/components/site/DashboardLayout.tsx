import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { getUser, clearUser, referralCodeFor } from "@/lib/auth";

export default function DashboardLayout() {
  const user = getUser();
  const loc = useLocation();
  const nav = [
    { to: "/dashboard", label: "Overview", exact: true },
    { to: "/dashboard/points", label: "Points Wallet" },
    { to: "/dashboard/referrals", label: "Referrals" },
    { to: "/dashboard/rank", label: "Rank & Milestones" },
    { to: "/dashboard/profile", label: "Profile" },
    { to: "/dashboard/team", label: "Team" },
    { to: "/dashboard/orders", label: "Orders" },
    { to: "/dashboard/resources", label: "Resources" },
  ];
  return (
    <div className="container mx-auto py-10">
      <div className="grid gap-6 md:grid-cols-[260px,1fr]">
        <aside className="rounded-2xl border bg-white p-4 h-fit">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-muted overflow-hidden">
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-sm font-semibold">
                  {user?.name?.[0] ?? "D"}
                </div>
              )}
            </div>
            <div>
              <div className="font-semibold leading-tight">
                {user?.name ?? "Amiy Expert"}
              </div>
              {user && (
                <div className="text-xs text-muted-foreground">
                  {referralCodeFor(user)}
                </div>
              )}
            </div>
          </div>
          <nav className="mt-6 space-y-1">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.exact}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-6 border-t pt-4">
            <button
              onClick={() => {
                clearUser();
                window.location.href = "/";
              }}
              className="w-full rounded-md border px-3 py-2 text-sm hover:bg-muted"
            >
              Log out
            </button>
          </div>
        </aside>
        <section>
          <Outlet />
        </section>
      </div>
    </div>
  );
}
