import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export default function Orders() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['myOrders'], queryFn: () => apiFetch('/orders') });
  const orders = (data ?? []) as any[];

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Orders</h1>
      <p className="mt-2 text-sm text-muted-foreground">Recent patient purchases via your code.</p>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="p-2">Order</th>
              <th className="p-2">Product</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Total</th>
              <th className="p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="p-4 text-sm text-muted-foreground">Loading orders…</td>
              </tr>
            )}
            {!isLoading && orders.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-sm text-muted-foreground">No orders found.</td>
              </tr>
            )}
            {!isLoading && orders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-2 font-medium">{o.id}</td>
                <td className="p-2">{o.metadata?.lineItems?.[0]?.title ?? o.shopify_order_id ?? '—'}</td>
                <td className="p-2">{o.metadata?.lineItems?.[0]?.quantity ?? o.quantity ?? '—'}</td>
                <td className="p-2">{o.amount ? `₹${Number(o.amount).toLocaleString()}` : '—'}</td>
                <td className="p-2">{o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
