import type { ReactNode } from "react";
import { getAdminSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return <>{children}</>;
}
