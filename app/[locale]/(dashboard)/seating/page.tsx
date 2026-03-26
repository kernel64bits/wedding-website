import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getGuestSession } from "@/lib/session";
import { getSettings, prisma } from "@/lib/prisma";
import { SeatingMap } from "@/components/seating/SeatingMap";

export default async function SeatingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getGuestSession();
  if (!session) redirect(`/${locale}`);

  const t = await getTranslations("seating");

  const [invitation, settings] = await Promise.all([
    prisma.invitation.findUnique({ where: { id: session.invitationId } }),
    getSettings(),
  ]);

  if (!invitation) redirect(`/${locale}`);

  const showMap = settings.seatingEnabled && invitation.tableNumber !== null;
  const tables = showMap
    ? await prisma.table.findMany({ orderBy: { number: "asc" } })
    : [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 space-y-6">
      <h1 className="font-serif text-4xl font-light">{t("title")}</h1>

      {!settings.seatingEnabled ? (
        <p className="text-muted-foreground">{t("pending")}</p>
      ) : invitation.tableNumber === null ? (
        <p className="text-muted-foreground">{t("noTable")}</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {t("yourTable", { number: invitation.tableNumber })}
          </p>
          <SeatingMap tables={tables} guestTableNumber={invitation.tableNumber} />
        </>
      )}
    </div>
  );
}
