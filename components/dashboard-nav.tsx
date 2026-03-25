"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const links = [
    { href: "/home",       label: t("home") },
    { href: "/info",       label: t("info") },
    { href: "/seating",    label: t("seating") },
    { href: "/gallery",    label: t("gallery") },
    { href: "/invitation", label: t("replay"), italic: true },
  ];

  return (
    <nav className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">

        {/* Site title */}
        <Link href="/home" className="font-serif text-xl font-light text-foreground">
          Sophie & John
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm transition-colors",
                link.italic && "italic",
                pathname.endsWith(link.href)
                  ? "font-medium text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          <LanguageSwitcher />
        </div>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="mt-8 flex flex-col gap-6">
                <p className="font-serif text-lg font-light">Sophie & John</p>
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "text-sm transition-colors",
                      link.italic && "italic",
                      pathname.endsWith(link.href)
                        ? "font-medium text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </nav>
  );
}
