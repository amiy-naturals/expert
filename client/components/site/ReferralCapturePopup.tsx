import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { getUser } from '@/lib/auth';

interface ReferralCapturePopupProps {
  referralCode: string;
  onSuccess?: () => void;
}

export default function ReferralCapturePopup({ referralCode, onSuccess }: ReferralCapturePopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const user = getUser();

  useEffect(() => {
    // Only show popup if:
    // 1. There's a referral code in URL
    // 2. User is NOT already logged in
    // 3. User hasn't dismissed it in this session
    if (referralCode && !user && !isDismissed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [referralCode, user, isDismissed]);

  const handleClose = () => {
    setIsOpen(false);
    setIsDismissed(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate: at least one field is required
    if (!email.trim() && !phone.trim()) {
      toast.error('Please enter your email or mobile number');
      return;
    }

    // Basic email validation if provided
    if (email.trim() && !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const data = await apiFetch('/referral-capture', {
        method: 'POST',
        body: JSON.stringify({
          referralCode,
          email: email.trim() || null,
          phone: phone.trim() || null,
        }),
      });

      toast.success('Thank you! We\'ll stay in touch with you.');

      // Reset form
      setEmail('');
      setPhone('');
      handleClose();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Referral capture error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to capture referral');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join Amiy Experts</DialogTitle>
          <DialogDescription>
            Get updates about our doctor partnership program, exclusive benefits, and networking opportunities.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm font-medium">
              Mobile Number <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
              className="mt-1"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            At least one contact method is required. We respect your privacy and won't spam you.
          </p>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Skip for Now
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Submitting...' : 'Join Now'}
            </Button>
          </div>
        </form>

        <div className="text-xs text-muted-foreground text-center">
          Already a member? <a href="/login" className="text-accent hover:underline">Sign in here</a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
