import React, { useEffect, useState } from "react";
import { useExpertCtx } from "./context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuthUser } from "@/lib/auth";

export default function AccountStep() {
  const { account, setAccount } = useExpertCtx();
  const [agree, setAgree] = useState(Boolean(account.agreeTerms));
  const navigate = useNavigate();
  const authUser = useAuthUser();

  useEffect(() => {
    if (authUser && !account.email) {
      setAccount({ email: authUser.email });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  const required = Boolean(account.firstName && account.lastName && account.email && agree);

  return (
    <div className="container mx-auto pb-16">
      <div className="mx-auto max-w-3xl rounded-lg border p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>First Name</Label>
            <Input
              value={account.firstName || ""}
              onChange={(e) => setAccount({ firstName: e.target.value })}
            />
          </div>
          <div>
            <Label>Last Name</Label>
            <Input
              value={account.lastName || ""}
              onChange={(e) => setAccount({ lastName: e.target.value })}
            />
          </div>
          {!authUser && (
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={account.email || ""}
                onChange={(e) => setAccount({ email: e.target.value })}
              />
            </div>
          )}
          <div>
            <Label>Primary Phone</Label>
            <Input
              value={account.phone || ""}
              onChange={(e) => setAccount({ phone: e.target.value })}
            />
          </div>
          <div>
            <Label>Birthday</Label>
            <Input
              type="date"
              value={account.birthday || ""}
              onChange={(e) => setAccount({ birthday: e.target.value })}
            />
          </div>
          <div>
            <Label>Gender</Label>
            <Input
              placeholder="Prefer not to say"
              value={account.gender || ""}
              onChange={(e) => setAccount({ gender: e.target.value })}
            />
          </div>
          <div>
            <Label>User Name</Label>
            <Input
              value={account.username || ""}
              onChange={(e) => setAccount({ username: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => {
                setAgree(e.target.checked);
                setAccount({ agreeTerms: e.target.checked });
              }}
            />
            <span>
              I agree to the Terms of Use, Expert Terms & Conditions and Privacy Policy.
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={Boolean(account.optInEmail)}
              onChange={(e) => setAccount({ optInEmail: e.target.checked })}
            />
            <span>Send me emails with promotions and updates.</span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={Boolean(account.allowMpManage)}
              onChange={(e) => setAccount({ allowMpManage: e.target.checked })}
            />
            <span>
              I grant my Market Partner permission to manage my subscription on my behalf.
            </span>
          </label>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button asChild variant="outline">
            <Link to="/expert/subscription">Back</Link>
          </Button>
          <Button disabled={!required} onClick={() => navigate("/expert/review")}>Next: Review</Button>
        </div>
      </div>
    </div>
  );
}
