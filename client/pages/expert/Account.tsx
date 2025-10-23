import React, { useEffect, useState } from "react";
import { useExpertCtx } from "./context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { useAuthUser } from "@/lib/auth";

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"] as const;

export default function AccountStep() {
  const { account, setAccount } = useExpertCtx();
  const [agree, setAgree] = useState(Boolean(account.agreeTerms));
  const navigate = useNavigate();
  const authUser = useAuthUser();
  const [openModal, setOpenModal] = useState<"tc" | "pp" | null>(null);

  useEffect(() => {
    if (authUser && !account.email) {
      setAccount({ email: authUser.email });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  const fullName = `${account.firstName || ""} ${account.lastName || ""}`.trim();

  const handleNameChange = (value: string) => {
    const parts = value.trim().split(/\s+/);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ");
    setAccount({ firstName, lastName });
  };

  const required = Boolean(account.firstName && account.lastName && account.email && agree);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto flex-1 pb-24 lg:pb-8">
        <div className="mx-auto max-w-3xl rounded-lg border p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Name</Label>
              <Input
                value={fullName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Full name"
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
              <Select value={account.gender || ""} onValueChange={(v) => setAccount({ gender: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                I agree to the Terms of Use,{" "}
                <button
                  type="button"
                  onClick={() => setOpenModal("tc")}
                  className="underline text-primary hover:text-primary/80"
                >
                  Expert Terms & Conditions
                </button>
                {" "}and{" "}
                <button
                  type="button"
                  onClick={() => setOpenModal("pp")}
                  className="underline text-primary hover:text-primary/80"
                >
                  Privacy Policy
                </button>
                .
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

          <div className="hidden lg:flex mt-6 items-center justify-between">
            <Button asChild variant="outline">
              <Link to="/expert/subscription">Back</Link>
            </Button>
            <Button disabled={!required} onClick={() => navigate("/expert/review")}>Next: Review</Button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 lg:hidden border-t bg-background p-3 flex gap-3">
        <Button asChild variant="outline" className="flex-1">
          <Link to="/expert/subscription">Back</Link>
        </Button>
        <Button disabled={!required} onClick={() => navigate("/expert/review")} className="flex-1 truncate">
          <span className="sm:hidden">Next</span>
          <span className="hidden sm:inline">Next: Review</span>
        </Button>
      </div>

      <Dialog open={openModal === "tc"} onOpenChange={(open) => setOpenModal(open ? "tc" : null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Expert Terms & Conditions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold mb-2">1. Expert Program Overview</h3>
              <p className="text-muted-foreground">
                The Amiy Expert program allows healthcare professionals to resell and recommend Amiy products to their patients and community. Experts receive exclusive discounts, recurring order benefits, and commission structures based on sales performance.
              </p>
            </section>
            <section>
              <h3 className="font-semibold mb-2">2. Eligibility Requirements</h3>
              <p className="text-muted-foreground">
                To qualify as an Amiy Expert, you must be a licensed healthcare professional (doctor, dermatologist, nutritionist, etc.) or a wellness consultant approved by Amiy. You must maintain a valid license and uphold professional standards.
              </p>
            </section>
            <section>
              <h3 className="font-semibold mb-2">3. Recurring Orders</h3>
              <p className="text-muted-foreground">
                Experts agree to schedule recurring orders at intervals of their choice (monthly or bi-monthly). Minimum order value of ₹1,000 applies. Orders can be modified, paused, or cancelled anytime with proper notice.
              </p>
            </section>
            <section>
              <h3 className="font-semibold mb-2">4. Pricing and Discounts</h3>
              <p className="text-muted-foreground">
                Expert pricing is tiered based on order value: 15% off for orders ₹1,000+, 20% off for ₹2,000+, and 25% off for ₹3,000+. These discounts apply to recurring and one-time orders. Prices are subject to change with 30 days' notice.
              </p>
            </section>
            <section>
              <h3 className="font-semibold mb-2">5. Limitations and Restrictions</h3>
              <p className="text-muted-foreground">
                Experts agree not to resell Amiy products through unauthorized channels, marketplaces, or retail stores without explicit written permission. Bulk resale agreements must be approved separately. Marketing materials must comply with regulatory guidelines.
              </p>
            </section>
            <section>
              <h3 className="font-semibold mb-2">6. Termination</h3>
              <p className="text-muted-foreground">
                Either party may terminate this agreement with 30 days' written notice. Amiy reserves the right to terminate for violation of these terms, misuse of the Expert designation, or regulatory non-compliance.
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openModal === "pp"} onOpenChange={(open) => setOpenModal(open ? "pp" : null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold mb-2">1. Information We Collect</h3>
              <p className="text-muted-foreground">
                We collect personal information including name, email, phone number, date of birth, gender, professional license details, and payment information. We also collect transaction history, order preferences, and device information for service improvement.
              </p>
            </section>
            <section>
              <h3 className="font-semibold mb-2">2. How We Use Your Information</h3>
              <p className="text-muted-foreground">
                Your information is used to process orders, manage your Expert account, provide customer support, send promotional communications (with your consent), calculate commissions, and comply with legal obligations. We do not sell your personal information to third parties.
              </p>
            </section>
            <section>
              <h3 className="font-semibold mb-2">3. Data Security</h3>
              <p className="text-muted-foreground">
                We implement industry-standard security measures including SSL encryption, secure servers, and regular security audits. While we strive to protect your information, no system is completely secure. You are responsible for maintaining confidentiality of your account credentials.
              </p>
            </section>
            <section>
              <h3 className="font-semibold mb-2">4. Information Sharing</h3>
              <p className="text-muted-foreground">
                We share information with payment processors, shipping partners, and analytics providers only as necessary to provide services. Market Partners may access relevant information to manage subscriptions on your behalf if you grant permission. We comply with legal requests from law enforcement.
              </p>
            </section>
            <section>
              <h3 className="font-semibold mb-2">5. Your Rights</h3>
              <p className="text-muted-foreground">
                You have the right to access, correct, or delete your personal information. You can opt out of promotional emails anytime. To exercise these rights, contact us at privacy@amiy.com. We will respond within 30 days.
              </p>
            </section>
            <section>
              <h3 className="font-semibold mb-2">6. Cookies and Tracking</h3>
              <p className="text-muted-foreground">
                We use cookies and similar technologies to enhance your experience, analyze usage patterns, and remember preferences. You can manage cookie settings in your browser. Disabling cookies may affect site functionality.
              </p>
            </section>
            <section>
              <h3 className="font-semibold mb-2">7. Changes to Privacy Policy</h3>
              <p className="text-muted-foreground">
                We may update this policy periodically. Changes will be posted on this page with an updated effective date. Your continued use of the platform constitutes acceptance of the updated policy.
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
