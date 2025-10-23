import { useExpertCtx } from "./context";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

export default function SubscriptionStep() {
  const { subscription, setSubscription, totals } = useExpertCtx();
  const pctOfTop = Math.min(100, Math.round((totals.subtotal / 3000) * 100));
  const valid = Boolean(subscription.nextDate);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto flex-1 pb-24 lg:pb-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 text-center">
            <div className="text-sm font-medium">
              {totals.discountPct >= 25
                ? "You did it! You just qualified for 25% off on your order!"
                : "Schedule and select ₹1000+ for your future recurring order"}
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
          </div>

          <div className="rounded-lg border p-4">
            <div className="grid gap-4 md:grid-cols-3 md:items-end">
              <div className="md:col-span-2">
                <Label className="mb-1 block">Schedule Your Next Expert Order</Label>
                <Input
                  type="date"
                  value={subscription.nextDate || ""}
                  onChange={(e) => setSubscription({ nextDate: e.target.value })}
                />
                <div className="mt-1 text-xs text-muted-foreground">
                  Please select a date between 2 and 60 days in the future.
                </div>
              </div>
              <div className="md:col-span-1">
                <Label className="mb-1 block">Frequency</Label>
                <RadioGroup
                  value={subscription.frequency}
                  onValueChange={(v) =>
                    setSubscription({ frequency: v as typeof subscription.frequency })
                  }
                  className="grid grid-cols-2 gap-3"
                >
                  <label className="flex items-center gap-2 text-sm">
                    <RadioGroupItem value="monthly" /> Monthly
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <RadioGroupItem value="alternate" /> Every other month
                  </label>
                </RadioGroup>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex mt-6 items-center justify-between">
            <Button asChild variant="outline">
              <Link to="/expert">Back</Link>
            </Button>
            <Button asChild disabled={!valid}>
              <Link to="/expert/account">Next: Account Creation</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 lg:hidden border-t bg-background p-3 flex gap-3">
        <Button asChild variant="outline" className="flex-1">
          <Link to="/expert">Back</Link>
        </Button>
        <Button asChild disabled={!valid} className="flex-1 truncate">
          <Link to="/expert/account">
            <span className="sm:hidden">Next</span>
            <span className="hidden sm:inline">Next: Account</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
