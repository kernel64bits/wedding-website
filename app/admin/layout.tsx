import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Admin — Wedding",
};

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} theme-classic`}>
      <body className="antialiased bg-background text-foreground">
        <div className="flex min-h-screen flex-col">
          <nav className="h-14 border-b border-border bg-card flex items-center gap-6 px-6">
            <span className="text-sm font-semibold tracking-wide">Admin</span>
            <Link
              href="/admin/guests"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Guests
            </Link>
            <Link
              href="/admin/tables"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Tables
            </Link>
            <div className="ml-auto">
              <form method="POST" action="/api/admin/logout">
                <button
                  type="submit"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Logout
                </button>
              </form>
            </div>
          </nav>
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
