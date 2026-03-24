import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getGuestSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { RsvpForm } from "@/components/rsvp-form";

export default async function RsvpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getGuestSession();
  if (!session) redirect(`/${locale}`);

  const [invitation, settings] = await Promise.all([
    prisma.invitation.findUnique({
      where: { id: session.invitationId },
      include: { attendees: true },
    }),
    prisma.settings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    }),
  ]);

  if (!invitation) redirect(`/${locale}`);

  const t = await getTranslations("rsvpForm");

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 space-y-8">
      <h1 className="font-serif text-4xl font-light">{t("title")}</h1>
      <RsvpForm invitation={invitation} rsvpLocked={settings.rsvpLocked === true} />
    </div>
  );
}
