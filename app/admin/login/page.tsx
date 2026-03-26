import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
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
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Admin</CardTitle>
          <CardDescription>
            Connectez-vous pour accéder à l&apos;administration.
          </CardDescription>
        </CardHeader>
        <form method="POST" action="/api/admin/login">
          <CardContent className="flex flex-col gap-4">
            {error === "invalid" && (
              <p className="text-sm text-destructive">
                Identifiant ou mot de passe incorrect.
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-sm font-medium">
                Identifiant
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                Mot de passe
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Se connecter
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
