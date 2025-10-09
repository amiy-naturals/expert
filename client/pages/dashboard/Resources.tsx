export default function Resources() {
  const items = [
    {
      title: "Vijaya Regulations",
      desc: "Compliance guide and best practices.",
    },
    {
      title: "Bio‑Neuro Modulation",
      desc: "Science and clinical application.",
    },
    {
      title: "Clinical Protocols",
      desc: "Pain & inflammation decision trees.",
    },
  ];
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
        Learning Resources
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Education to strengthen ethical practice and outcomes.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {items.map((i) => (
          <div key={i.title} className="rounded-2xl border bg-white p-6">
            <div className="font-semibold">{i.title}</div>
            <p className="mt-2 text-sm text-muted-foreground">{i.desc}</p>
            <button className="mt-4 inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm hover:bg-muted">
              Open
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
