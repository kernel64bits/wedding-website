import { setRequestLocale } from "next-intl/server";

export default async function GatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-4xl font-light text-foreground">
          Scannez votre QR code
        </h1>
        <p className="text-muted-foreground">Coming in T2.1</p>
      </div>
    </div>
  );
}
