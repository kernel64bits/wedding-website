import { prisma } from "@/lib/prisma";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GuestListClient } from "@/components/admin/guest-list-client";

function StatCard({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number;
  colorClass?: string;
}) {
  return (
    <Card className="items-center py-0">
      <CardContent className="flex flex-col items-center py-4 text-center">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className={`mt-2 text-4xl font-semibold ${colorClass ?? ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export default async function AdminGuestsPage() {
  const invitations = await prisma.invitation.findMany({
    include: { attendees: { orderBy: { isPrimary: "desc" } } },
    orderBy: { createdAt: "asc" },
  });

  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

  const attending = invitations
    .flatMap((i) => i.attendees)
    .filter((a) => a.attending === true).length;

  const stats = {
    total: invitations.length,
    confirmed: invitations.filter((i) => i.rsvpStatus === "confirmed").length,
    declined: invitations.filter((i) => i.rsvpStatus === "declined").length,
    pending: invitations.filter((i) => i.rsvpStatus === "pending").length,
    attending,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Guests</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="Total" value={stats.total} />
        <StatCard
          label="Confirmed"
          value={stats.confirmed}
          colorClass="text-green-600"
        />
        <StatCard
          label="Declined"
          value={stats.declined}
          colorClass="text-destructive"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          colorClass="text-muted-foreground"
        />
        <StatCard
          label="Attending"
          value={stats.attending}
          colorClass="text-primary"
        />
      </div>

      <GuestListClient invitations={invitations} baseUrl={baseUrl} />
    </div>
  );
}
