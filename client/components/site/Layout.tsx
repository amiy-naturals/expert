import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { getUser, clearUser } from "@/lib/auth";
import { signOut } from "@/lib/supabase";
import JoinCTA from "@/components/site/JoinCTA";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default function Layout() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  const nav = [
    { label: "Shop", to: "/shop" },
    { label: "Amiy Army", to: "/army" },
    { label: "Compensation", to: "/compensation" },
  ];
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 font-extrabold text-xl tracking-tight"
        >
          {/* Logo GIF */}
          <img
            src="https://cdn.builder.io/o/assets%2Fe19fb208997349f782e0de8b9d943853%2Fae5c836811354240b47db51b9f08f27a?alt=media&token=c4418d9d-e826-4bd1-bbf5-518433ea2ad4&apiKey=e19fb208997349f782e0de8b9d943853"
            alt="Amiy logo"
            className="h-9 w-auto object-contain"
          />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {nav.map((i) => (
            <Link
              key={i.to}
              to={i.to}
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <button className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-96">
              <nav className="flex flex-col gap-4 mt-8">
                {nav.map((i) => (
                  <Link
                    key={i.to}
                    to={i.to}
                    className="text-foreground/80 hover:text-foreground transition-colors py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {i.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <AuthActions />
        </div>
      </div>
    </header>
  );
}

function AuthActions() {
  const user = getUser();
  const [showDashboard, setShowDashboard] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      try {
        const res = await (await import("@/lib/api")).ExpertAPI.me();
        if (!cancelled) setShowDashboard(!!res.onboarded);
      } catch {
        if (!cancelled) setShowDashboard(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <>
        <JoinCTA>Join as Amiy Expert</JoinCTA>
        <Link
          to="/login"
          className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Sign in
        </Link>
      </>
    );
  }
  return (
    <div className="flex items-center gap-3">
      {showDashboard ? (
        <Link
          to="/dashboard"
          className="hidden md:inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Dashboard
        </Link>
      ) : (
        <JoinCTA>Join as Amiy Expert</JoinCTA>
      )}
      <div className="h-8 w-8 rounded-full bg-muted overflow-hidden">
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar}
            alt={user.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs font-semibold">
            {user.name?.slice(0, 1) || "D"}
          </div>
        )}
      </div>
      <button
        onClick={async () => {
          try {
            await signOut();
          } catch {}
          clearUser();
          window.location.href = "/";
        }}
        className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
      >
        Log out
      </button>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-white/60 dark:bg-background/80">
      <div className="container mx-auto py-10 grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-bold text-lg">
            <img
              src="https://cdn.builder.io/o/assets%2Fe19fb208997349f782e0de8b9d943853%2Fae5c836811354240b47db51b9f08f27a?alt=media&token=c4418d9d-e826-4bd1-bbf5-518433ea2ad4&apiKey=e19fb208997349f782e0de8b9d943853"
              alt="Amiy logo"
              className="h-8 w-auto object-contain"
            />
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm">
            Ayurveda-first wellness with ethical, doctor-led care. Empowering
            Amiy Experts to educate, prescribe, and grow.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3">Program</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/army" className="hover:underline">
                Amiy Army
              </Link>
            </li>
            <li>
              <Link to="/compensation" className="hover:underline">
                Compensation Plan
              </Link>
            </li>
            <li>
              <Link to="/events" className="hover:underline">
                Events & Webinars
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3">Get Involved</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/join" className="hover:underline">
                Become an Amiy Expert
              </Link>
            </li>
            <li>
              <Link to="/shop" className="hover:underline">
                Shop Products
              </Link>
            </li>
            <li>
              <a href="mailto:hello@amiy.naturals" className="hover:underline">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4">
        <div className="container mx-auto flex items-center justify-between text-xs text-muted-foreground gap-4">
          <span>© {new Date().getFullYear()} Amiy Naturals</span>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link to="/terms-and-conditions" className="hover:underline">
              Terms & Conditions
            </Link>
            <span>Vijaya therapy compliant. Ethical practice only.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
