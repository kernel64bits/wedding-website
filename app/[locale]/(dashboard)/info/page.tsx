import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// TODO: replace with real venue coordinates before launch
const VENUE_MAP_SRC =
  "https://www.openstreetmap.org/export/embed.html?bbox=2.3522,48.8566,2.3622,48.8666&layer=mapnik&marker=48.8616,2.3572";

export default async function InfoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tInvitation] = await Promise.all([
    getTranslations("info"),
    getTranslations("invitation"),
  ]);

  const scheduleItems = [
    { time: t("schedule.item1.time"), title: t("schedule.item1.title"), location: t("schedule.item1.location"), icon: t("schedule.item1.icon") },
    { time: t("schedule.item2.time"), title: t("schedule.item2.title"), location: t("schedule.item2.location"), icon: t("schedule.item2.icon") },
    { time: t("schedule.item3.time"), title: t("schedule.item3.title"), location: t("schedule.item3.location"), icon: t("schedule.item3.icon") },
    { time: t("schedule.item4.time"), title: t("schedule.item4.title"), location: t("schedule.item4.location"), icon: t("schedule.item4.icon") },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 space-y-6">
      <h1 className="font-serif text-4xl font-light">{t("title")}</h1>

      {/* Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">{t("schedule.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative border-l border-border space-y-6 ml-2">
            {scheduleItems.map((item, i) => (
              <li key={i} className="pl-6 relative">
                <span className="absolute -left-5 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background border border-border text-xl">
                  {item.icon}
                </span>
                <p className="text-xs text-muted-foreground">{item.time}</p>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.location}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Venue */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">{t("venue.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">{t("venue.addressLabel")}</dt>
            <dd>
              <span className="block">{tInvitation("details.venueName")}</span>
              <span className="block text-muted-foreground">{tInvitation("details.address")}</span>
            </dd>
          </dl>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t("venue.mapLabel")}</p>
          <div className="rounded-lg overflow-hidden border border-border aspect-video">
            <iframe
              src={VENUE_MAP_SRC}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              title={tInvitation("details.venueName")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Transport */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">{t("transport.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{t("transport.car")}</p>
          <p>{t("transport.transit")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
