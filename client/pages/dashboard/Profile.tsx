import { useRef, useState } from "react";
import { getUser, updateUser, User } from "@/lib/auth";
import { UsersAPI, uploadImageAndGetUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const existing = getUser();
  const [form, setForm] = useState<Partial<User>>({
    name: existing?.name,
    email: existing?.email,
    clinic: existing?.clinic,
    bio: existing?.bio,
    avatar: existing?.avatar,
  });
  const [saved, setSaved] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await UsersAPI.me();
        setForm((f) => ({ ...f, name: me?.name ?? f.name, email: me?.email ?? f.email, clinic: me?.clinic ?? f.clinic, bio: me?.bio ?? f.bio, avatar: me?.avatar ?? f.avatar }));
      } catch {}
    })();
  }, []);

  function onChange<K extends keyof User>(key: K, value: User[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onFileSelected(file?: File) {
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadImageAndGetUrl(file);
      setForm((f) => ({ ...f, avatar: url }));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onSave() {
    setLoading(true);
    try {
      const updated = await UsersAPI.updateMe({
        name: form.name ?? existing?.name ?? "",
        email: form.email ?? existing?.email ?? "",
        clinic: form.clinic ?? existing?.clinic,
        bio: form.bio ?? existing?.bio,
        avatar: form.avatar ?? existing?.avatar,
      });
      updateUser({ ...existing, ...updated } as any);
      setSaved("Saved!");
      setTimeout(() => setSaved(""), 1500);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
        Profile
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Update your display info, clinic, bio, and profile picture.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-[160px,1fr]">
        <div>
          <div className="h-36 w-36 rounded-full bg-muted overflow-hidden">
            {form.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.avatar}
                alt={form.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-3xl font-semibold">
                {(form.name ?? existing?.name ?? "D").slice(0, 1)}
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFileSelected(e.target.files?.[0])}
          />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={loading}>
            {loading ? (
              <span className="inline-flex items-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />Uploading…</span>
            ) : (
              "Change Photo"
            )}
          </Button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.name ?? ""}
              onChange={(e) => onChange("name", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.email ?? ""}
              onChange={(e) => onChange("email", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Clinic</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.clinic ?? ""}
              onChange={(e) => onChange("clinic", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Bio</label>
            <textarea
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              rows={4}
              value={form.bio ?? ""}
              onChange={(e) => onChange("bio", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <span className="inline-flex items-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />Saving…</span>
              ) : (
                "Save Changes"
              )}
            </Button>
            {saved && <span className="text-sm text-emerald-600">{saved}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
