import { DISCOUNT_THRESHOLDS, setCatalog, type Product as ExpertProduct } from "@/lib/expert";
import { useExpertCtx } from "./context";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ProductsAPI } from "@/lib/api";

export default function CartStep() {
  const { cart, setCart, totals } = useExpertCtx();
  const [catalog, setLocalCatalog] = useState<ExpertProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await ProductsAPI.list({ limit: 50, status: "active" });
        const mapped: ExpertProduct[] = (res.products || []).map((p) => ({
          id: String(p.id),
          name: p.title,
          price: p.defaultPrice ?? p.variants[0]?.price ?? 0,
          image: p.images?.[0]?.src,
        }));
        if (!mounted) return;
        setCatalog(mapped); // update global price lookup for totals
        setLocalCatalog(mapped);
      } catch (e) {
        setError((e as Error).message || "Failed to load catalog");
        setLocalCatalog([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const byId = useMemo(() => {
    const map = new Map<string, number>();
    cart.forEach((c) => map.set(c.productId, c.qty));
    return map;
  }, [cart]);

  const nextThreshold = useMemo(() => {
    const remaining = DISCOUNT_THRESHOLDS.find((t) => totals.subtotal < t.at);
    return remaining ? remaining.at - totals.subtotal : 0;
  }, [totals]);

  const pctOfTop = Math.min(100, Math.round((totals.subtotal / 3000) * 100));
  const minReached = totals.subtotal >= 1000;

  function changeQty(id: string, delta: number) {
    setCart((prev) => {
      const copy = [...prev];
      const i = copy.findIndex((x) => x.productId === id);
      if (i === -1 && delta > 0) copy.push({ productId: id, qty: 1 });
      else if (i >= 0) {
        copy[i] = { ...copy[i], qty: Math.max(0, copy[i].qty + delta) };
        if (copy[i].qty === 0) copy.splice(i, 1);
      }
      return copy;
    });
  }

  const loading = catalog === null;

  return (
    <div className="container mx-auto pb-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 text-center">
          <div className="text-sm font-medium">
            {totals.discountPct >= 25
              ? "You did it! You just qualified for 25% off on your order!"
              : minReached
                ? "Congrats! You have met the order threshold. Keep adding to get a higher discount."
                : "Add products worth at least ₹1000 to unlock 15% off"}
          </div>
          <div className="mt-3">
            <Progress value={pctOfTop} />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>₹1000</span>
              <span>15%</span>
              <span>20%</span>
              <span>25%</span>
            </div>
          </div>
          {nextThreshold > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              ₹{nextThreshold} more to reach next discount tier
            </div>
          )}
        </div>

        {loading ? (
          <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">Loading products…</div>
        ) : (catalog?.length ?? 0) === 0 ? (
          <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
            {error || "No products available in the expert catalog."}
            <div className="mt-4">
              <a href="/shop" className="underline">
                Browse public shop
              </a>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {catalog!.map((p) => {
              const qty = byId.get(p.id) || 0;
              return (
                <div key={p.id} className="rounded-lg border p-4">
                  <div className="h-36 w-full overflow-hidden rounded bg-muted">
                    {p.image ? (
                      // eslint-disable-next-line jsx-a11y/alt-text
                      <img src={p.image} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="mt-4 text-sm font-semibold uppercase">{p.name}</div>
                  <div className="text-sm text-muted-foreground">₹{p.price}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => changeQty(p.id, -1)}>
                      -
                    </Button>
                    <div className="w-8 text-center">{qty}</div>
                    <Button size="sm" onClick={() => changeQty(p.id, 1)}>
                      +
                    </Button>
                  </div>
                  <Button className="mt-3 w-full" variant={qty > 0 ? "secondary" : "default"} onClick={() => changeQty(p.id, 1)}>
                    {qty > 0 ? "Added" : "Add"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mx-auto mt-8 max-w-3xl rounded-lg border p-4">
          <div className="flex items-center justify-between text-sm">
            <div>Subtotal</div>
            <div>₹{totals.subtotal}</div>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <div>Discount</div>
            <div>
              {totals.discountPct}% (−₹{totals.discountAmount})
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between font-semibold">
            <div>Total</div>
            <div>₹{totals.total}</div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Button asChild disabled={!minReached}>
            <Link to="/expert/subscription">Next: Create Subscription</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
