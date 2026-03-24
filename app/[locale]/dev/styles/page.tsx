import { setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Theme } from "@/lib/theme.config";

export default async function StylesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const themes: Theme[] = ["theme-warm", "theme-blue", "theme-classic", "theme-rose"];

  return (
    <main className="min-h-screen bg-neutral-200 px-8 py-16 space-y-16">

      {/* ── Theme comparison grid ── */}
      <section className="space-y-6">
        <h1 className="text-2xl font-bold text-neutral-800">Theme Comparison</h1>
        <p className="text-sm text-neutral-500">
          Switch active theme in <code className="bg-neutral-300 px-1 rounded">lib/theme.config.ts</code>
        </p>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {themes.map((theme) => (
            <ThemePanel key={theme} theme={theme} />
          ))}
        </div>
      </section>

      {/* ── Full token reference (active theme) ── */}
      <section className="space-y-12">
        <h2 className="text-2xl font-bold text-neutral-800">Full Token Reference (active theme)</h2>

        {/* Typography */}
        <div className="bg-background rounded-2xl p-8 space-y-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Serif — Cormorant Garamond</p>
          <div className="space-y-3">
            <p className="font-serif text-6xl font-light leading-tight">Heading 1 — Sophie & John</p>
            <p className="font-serif text-4xl font-normal leading-tight">Heading 2 — Our Wedding Day</p>
            <p className="font-serif text-3xl font-medium italic leading-snug">Heading 3 — Italic Display</p>
            <p className="font-serif text-2xl leading-snug">Heading 4 — Section Title</p>
            <p className="font-serif text-xl leading-snug">Heading 5 — Subsection</p>
          </div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mt-6">Sans — Inter</p>
          <div className="space-y-2">
            <p className="text-lg">Large body — We are delighted to invite you to celebrate with us.</p>
            <p className="text-base">Base body — The ceremony will take place at 3:00 PM, followed by dinner and dancing.</p>
            <p className="text-sm text-muted-foreground">Small / muted — RSVP by June 1st. Formal attire requested.</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Overline / label</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="bg-background rounded-2xl p-8 space-y-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Buttons</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </div>

        {/* Card + Input + Badge */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl font-medium">Example Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Card surface using the theme&apos;s card token and border.
              </p>
            </CardContent>
          </Card>

          <div className="bg-background rounded-xl p-6 space-y-3 border border-border">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Inputs</p>
            <Input placeholder="Your full name" />
            <Input placeholder="Email address" type="email" />
            <Input placeholder="Disabled" disabled />
          </div>

          <div className="bg-background rounded-xl p-6 space-y-3 border border-border">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Badges</p>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </div>
        </div>

      </section>
    </main>
  );
}

function ThemePanel({ theme }: { theme: Theme }) {
  const labels: Record<Theme, string> = {
    "theme-warm":    "Warm — Romantic & earthy",
    "theme-blue":    "Blue — Modern & serene",
    "theme-classic": "Classic — Timeless, white + gold",
    "theme-rose":    "Rose — Soft & romantic",
  };

  return (
    <div className={`${theme} rounded-2xl p-6 space-y-5`}>
      <div className="bg-background rounded-xl p-6 space-y-5">

        {/* Label */}
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{labels[theme]}</p>

        {/* Color swatches */}
        <div className="grid grid-cols-4 gap-2">
          <Swatch bg="bg-primary" label="primary" />
          <Swatch bg="bg-secondary" label="secondary" />
          <Swatch bg="bg-accent" label="accent" />
          <Swatch bg="bg-muted" label="muted" />
          <Swatch bg="bg-background" label="background" border />
          <Swatch bg="bg-card" label="card" border />
          <Swatch bg="bg-destructive" label="destructive" />
          <Swatch bg="bg-ring" label="ring" />
        </div>

        {/* Typography sample */}
        <div className="space-y-1">
          <p className="font-serif text-2xl font-light text-foreground">Sophie & John</p>
          <p className="text-sm text-muted-foreground">Join us on our special day</p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button variant="default" size="sm">Confirm RSVP</Button>
          <Button variant="outline" size="sm">Learn More</Button>
          <Button variant="secondary" size="sm">Info</Button>
        </div>

        {/* Mini card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-base font-medium">Saturday, June 2026</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Château des Fleurs — 4:00 PM</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function Swatch({
  bg,
  label,
  border = false,
}: {
  bg: string;
  label: string;
  border?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className={`h-8 w-full rounded ${bg}${border ? " border border-border" : ""}`} />
      <p className="text-[10px] text-muted-foreground truncate">{label}</p>
    </div>
  );
}
