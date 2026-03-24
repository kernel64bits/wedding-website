"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/lib/navigation";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const otherLocale = locale === "fr" ? "en" : "fr";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.replace(pathname, { locale: otherLocale })}
    >
      {otherLocale.toUpperCase()}
    </Button>
  );
}
