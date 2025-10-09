export default function Events() {
  const items = [
    {
      title: "Monthly Zoom Meets",
      desc: "Product updates and success stories.",
    },
    {
      title: "Expert Webinars",
      desc: "Host sessions on pain management and Amiy products; earn speaker bonuses.",
    },
    {
      title: "Corporate Workshops",
      desc: "Body & mind wellness programs for organizations.",
    },
    {
      title: "Social Media Shoots",
      desc: "Get coupons/vouchers/points redeemable on website or encashable.",
    },
  ];

  return (
    <div className="container mx-auto py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Events & Webinars
        </h1>
        <p className="mt-3 text-muted-foreground">
          Educate, inspire, and grow your presence in the Amiy community.
        </p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {items.map((i) => (
          <div key={i.title} className="rounded-2xl border bg-white p-6">
            <div className="font-semibold">{i.title}</div>
            <p className="mt-2 text-sm text-muted-foreground">{i.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
