import { setRequestLocale } from "next-intl/server";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-5xl font-light text-foreground">
          Sophie & John
        </h1>
        <p className="text-muted-foreground">Coming in T3.1</p>
      </div>
    </div>
  );
}
