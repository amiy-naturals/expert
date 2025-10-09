import { useQuery } from "@tanstack/react-query";
import { ProductsAPI, type Product } from "@/lib/api";

export default function Shop() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["products"],
    queryFn: () => ProductsAPI.list({ limit: 24, status: "active" }),
  });

  const products = data?.products ?? [];
  const cfg = useQuery({ queryKey: ["loyalty","config"], queryFn: () => fetch("/api/loyalty/config").then(r => r.json()) });

  return (
    <div className="container mx-auto py-16">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border bg-amber-50 p-4 text-amber-900 text-sm flex flex-wrap items-center justify-between gap-3">
          <div>
            Free Shipping & COD • 7‑day returns • Free Doctor Consultation on all orders
          </div>
        </div>

        <h1 className="mt-8 text-3xl md:text-4xl font-extrabold tracking-tight text-center">
          Shop Products
        </h1>
        <p className="mt-3 text-center text-muted-foreground">
          Doctor‑formulated, Ayurveda‑first oral drops.
        </p>

        {isLoading && <div className="mt-8 text-center text-sm text-muted-foreground">Loading products…</div>}
        {isError && (
          <div className="mt-8 rounded border bg-red-50 p-3 text-sm text-red-700">
            {(error as Error)?.message || "Failed to load products"}
          </div>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0]?.src;
  const price = product.defaultPrice ?? product.variants[0]?.price ?? 0;
  const compareAt = product.compareAtPrice ?? product.variants[0]?.compareAtPrice ?? null;
  const { data: cfg } = useQuery({ queryKey: ["loyalty","config"], queryFn: () => fetch("/api/loyalty/config").then(r => r.json()) });
  const earn = cfg?.pointPerRupee ? Math.max(0, Math.floor(price * cfg.pointPerRupee)) : null;
  return (
    <div className="rounded-2xl border bg-white p-6">
      <div className="aspect-square w-full overflow-hidden rounded bg-muted">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={product.title} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="font-semibold">{product.title}</div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-xl font-extrabold">₹{price.toLocaleString()}</div>
        {compareAt ? (
          <div className="text-sm text-muted-foreground line-through">₹{compareAt.toLocaleString()}</div>
        ) : null}
      </div>
      {earn !== null && (
        <div className="mt-1 text-xs text-muted-foreground">Earn {earn} points with this purchase</div>
      )}
      <a href={`/buy/${encodeURIComponent(product.handle)}`} className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:opacity-90">
        Buy Now
      </a>
    </div>
  );
}
