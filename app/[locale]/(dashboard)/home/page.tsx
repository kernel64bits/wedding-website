import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getGuestSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Link } from "@/lib/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DietarySlug, parseDietary } from "@/lib/dietary";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getGuestSession();
  if (!session) redirect(`/${locale}`);

  const invitation = await prisma.invitation.findUnique({
    where: { id: session.invitationId },
    include: { attendees: true },
  });
  if (!invitation) redirect(`/${locale}`);

  const [t, tRsvp, tInvitation] = await Promise.all([
    getTranslations("dashboard"),
    getTranslations("rsvpForm"),
    getTranslations("invitation"),
  ]);

  const primaryAttendee = invitation.attendees.find((a) => a.isPrimary);
  const firstName = primaryAttendee?.name.split(" ")[0] ?? invitation.groupLabel;

  const rsvpStatus = invitation.rsvpStatus as "pending" | "confirmed" | "declined";

  const badgeVariant =
    rsvpStatus === "confirmed"
      ? "default"
      : rsvpStatus === "declined"
        ? "outline"
        : "secondary";

  const attendees = invitation.attendees.filter((a) => !a.isPlusOne);
  const plusOne = invitation.attendees.find((a) => a.isPlusOne);

  const dietaryLabels: Record<DietarySlug, string> = {
    "vegan": tRsvp("dietaryOptions.vegan"),
    "gluten-free": tRsvp("dietaryOptions.glutenFree"),
    "nuts": tRsvp("dietaryOptions.nuts"),
  };

  function formatDietary(raw: string | null): string {
    const { slugs, other } = parseDietary(raw);
    const parts: string[] = slugs.map((s) => dietaryLabels[s]);
    if (other) parts.push(other);
    return parts.length > 0 ? parts.join(", ") : "—";
  }

  const showSummary = rsvpStatus !== "pending";

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 space-y-6">
      <h1 className="font-serif text-4xl font-light">
        {t("greeting", { name: firstName })}
      </h1>

      {/* RSVP card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base font-medium">{t("rsvp.title")}</CardTitle>
            <Badge variant={badgeVariant}>{t(`rsvp.${rsvpStatus}`)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showSummary && (
            <ul className="space-y-2 text-sm">
              {[...attendees, ...(plusOne ? [plusOne] : [])].map((a) => (
                <li key={a.id} className="flex items-baseline gap-3">
                  <span
                    className={cn(
                      "w-4 shrink-0 text-center",
                      a.attending ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {a.attending ? "✓" : "✗"}
                  </span>
                  <span className={cn("font-medium shrink-0", !a.attending && "text-muted-foreground")}>
                    {a.name}
                  </span>
                  {a.attending && (
                    <span className="text-muted-foreground truncate">
                      {formatDietary(a.dietaryRestrictions)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div>
            {rsvpStatus === "pending" ? (
              <Button asChild size="sm">
                <Link href="/rsvp">{t("rsvp.cta")}</Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link href="/rsvp">{t("rsvp.update")}</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Wedding details card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">{t("eventDetails.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">{tInvitation("details.dateLabel")}</dt>
            <dd>{tInvitation("details.date")}</dd>
            <dt className="text-muted-foreground">{tInvitation("details.timeLabel")}</dt>
            <dd>{tInvitation("details.time")}</dd>
            <dt className="text-muted-foreground">{tInvitation("details.venueLabel")}</dt>
            <dd>
              <span className="block">{tInvitation("details.venueName")}</span>
              <span className="block text-muted-foreground">{tInvitation("details.address")}</span>
            </dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
 
