import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getGuestSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Link } from "@/lib/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

  const t = await getTranslations("dashboard");
  const primaryAttendee = invitation.attendees.find((a) => a.isPrimary);
  const firstName = primaryAttendee?.name.split(" ")[0] ?? invitation.groupLabel;

  const rsvpStatus = invitation.rsvpStatus as "pending" | "confirmed" | "declined";

  const badgeVariant =
    rsvpStatus === "confirmed"
      ? "default"
      : rsvpStatus === "declined"
        ? "outline"
        : "secondary";

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 space-y-10">
      <h1 className="font-serif text-4xl font-light">
        {t("greeting", { name: firstName })}
      </h1>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">{t("rsvp.title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <Badge variant={badgeVariant}>{t(`rsvp.${rsvpStatus}`)}</Badge>
          {rsvpStatus === "pending" && (
            <Button asChild size="sm">
              <Link href="/rsvp">{t("rsvp.cta")}</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
