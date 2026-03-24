import { DashboardNav } from "@/components/dashboard-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-8 text-center">
        <p className="font-serif text-lg text-muted-foreground">Sophie & John</p>
        <p className="mt-1 text-sm text-muted-foreground">Juin 2026</p>
      </footer>
    </div>
  );
}
