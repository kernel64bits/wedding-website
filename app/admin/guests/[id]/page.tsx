export default async function AdminGuestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-semibold">Guest Detail</h1>
      <p className="text-muted-foreground text-sm">ID: {id}</p>
      <p className="text-muted-foreground">Coming in T5.3</p>
    </div>
  );
}
