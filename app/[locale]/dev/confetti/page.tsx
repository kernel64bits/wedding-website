"use client";

import dynamic from "next/dynamic";

// Disable SSR entirely — avoids Motion hydration mismatches on this dev page
const ConfettiDevClient = dynamic(() => import("./ConfettiDevClient"), {
  ssr: false,
});

export default function ConfettiDevPage() {
  return <ConfettiDevClient />;
}
