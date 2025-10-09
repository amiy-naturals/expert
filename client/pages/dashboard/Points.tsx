import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export default function PointsWallet() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["loyalty","me"],
    queryFn: () => apiFetch("/loyalty/me"),
  });
  const balance = Number((data as any)?.balance ?? 0);
  const txs = ((data as any)?.transactions ?? []) as any[];

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Points Wallet</h1>
      <p className="mt-2 text-sm text-muted-foreground">Your current points and history.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6">
          <div className="text-sm text-muted-foreground">Current Balance</div>
          <div className="mt-2 text-3xl font-extrabold">{balance.toLocaleString()} pts</div>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="p-2">Date</th>
              <th className="p-2">Change</th>
              <th className="p-2">Reason</th>
              <th className="p-2">Order</th>
              <th className="p-2">Balance After</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="p-4 text-sm text-muted-foreground">Loading…</td></tr>
            )}
            {isError && (
              <tr><td colSpan={5} className="p-4 text-sm text-red-600">{(error as Error)?.message || "Failed to load"}</td></tr>
            )}
            {!isLoading && !isError && txs.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-sm text-muted-foreground">No transactions yet.</td></tr>
            )}
            {!isLoading && !isError && txs.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-2">{t.created_at ? new Date(t.created_at).toLocaleString() : "—"}</td>
                <td className={`p-2 font-medium ${Number(t.delta) >= 0 ? "text-green-600" : "text-red-600"}`}>{Number(t.delta) >= 0 ? "+" : ""}{Number(t.delta)}</td>
                <td className="p-2">{t.reason?.replaceAll("_"," ")}</td>
                <td className="p-2">{t.order_id ?? "—"}</td>
                <td className="p-2">{t.balance_after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
