import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { getAdminSession } from "@/lib/session";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getAdminSession();
  if (session) redirect("/admin/guests");

  const { error } = await searchParams;

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <LockKeyhole className="h-8 w-8 text-primary" strokeWidth={1.5} />
          <div className="h-px w-12 bg-primary" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Administration</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to the admin panel.
            </p>
          </div>
        </div>

        <form method="POST" action="/api/admin/login" className="space-y-4">
          {error === "invalid" && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2">
              <p className="text-sm text-destructive">Invalid username or password.</p>
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
