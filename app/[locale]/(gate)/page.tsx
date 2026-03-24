import { getTranslations, setRequestLocale } from "next-intl/server";
import { QrCode } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function GatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("gate");

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-6">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <h1 className="font-serif text-4xl font-light text-foreground">
          {t("title")}
        </h1>
        <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
          {t("subtitle")}
        </p>

        <div className="my-6 h-px w-16 bg-primary" />

        <QrCode className="my-4 h-16 w-16 text-primary" strokeWidth={1.25} />

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {t("instruction")}
        </p>
      </div>
    </div>
  );
}
