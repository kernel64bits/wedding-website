import { setRequestLocale } from "next-intl/server";

export default async function InfoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-4xl font-light">Informations</h1>
        <p className="text-muted-foreground">Coming in T4.3</p>
      </div>
    </div>
  );
}
