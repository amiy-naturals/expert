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
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto flex-1 pb-24 lg:pb-8">
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

        <div className="grid gap-4 lg:gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
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
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3">
                {catalog!.map((p) => {
                  const qty = byId.get(p.id) || 0;
                  return (
                    <div key={p.id} className="rounded-lg border p-3">
                      <div className="h-24 w-full overflow-hidden rounded bg-muted">
                        {p.image ? (
                          // eslint-disable-next-line jsx-a11y/alt-text
                          <img src={p.image} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="mt-2 line-clamp-2 text-xs font-semibold uppercase">{p.name}</div>
                      <div className="text-xs text-muted-foreground">₹{p.price}</div>
                      <div className="mt-2 flex items-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => changeQty(p.id, -1)}>
                          -
                        </Button>
                        <div className="w-6 text-center text-xs">{qty}</div>
                        <Button size="sm" onClick={() => changeQty(p.id, 1)}>
                          +
                        </Button>
                      </div>
                      <Button className="mt-2 w-full text-xs" variant={qty > 0 ? "secondary" : "default"} onClick={() => changeQty(p.id, 1)}>
                        {qty > 0 ? "Added" : "Add"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-lg border p-4">
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

              <Button asChild disabled={!minReached} className="w-full">
                <Link to="/expert/subscription" className="truncate">Next: Create Subscription</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 lg:hidden border-t bg-background p-4 space-y-3">
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between text-xs">
            <div>Subtotal</div>
            <div>₹{totals.subtotal}</div>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <div>Discount</div>
            <div>
              {totals.discountPct}% (−₹{totals.discountAmount})
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between font-semibold text-sm">
            <div>Total</div>
            <div>₹{totals.total}</div>
          </div>
        </div>

        <Button asChild disabled={!minReached} className="w-full">
          <Link to="/expert/subscription" className="truncate">Next: Create Subscription</Link>
        </Button>
      </div>
    </div>
  );
}
