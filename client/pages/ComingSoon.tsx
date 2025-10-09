import { useLocation, Link } from "react-router-dom";

export default function ComingSoon() {
  const { pathname } = useLocation();
  const label = (pathname || "").split("/").join(" ").trim() || "Home";
  return (
    <section className="container mx-auto py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          {label} — Coming Soon
        </h1>
        <p className="mt-4 text-muted-foreground">
          This section will be built next. Tell us what you want to see here and
          we'll craft it to your needs.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/join"
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
          >
            Become an Amiy Expert
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-muted"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}
