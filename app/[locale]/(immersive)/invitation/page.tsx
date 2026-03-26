import { setRequestLocale } from "next-intl/server";
import { getGuestSession } from "@/lib/session";
import { InvitationExperience } from "@/components/invitation/InvitationExperience";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getGuestSession();

  return (
    <InvitationExperience
      invitationId={session?.invitationId ?? null}
    />
  );
}
