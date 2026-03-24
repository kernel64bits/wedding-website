"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Confetti, DEFAULT_CONFETTI_CONFIG } from "@/components/invitation/Confetti";

export default function ConfettiDevClient() {
  const [burst, setBurst] = useState(1);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[oklch(0.52_0.082_55.7)] p-8">
      <h1 className="font-serif text-3xl font-light text-[oklch(0.992_0.003_78)]">
        Confetti dev
      </h1>

      {/* key change remounts <Confetti />, restarting all animations */}
      <AnimatePresence mode="sync">
        <Confetti key={burst} />
      </AnimatePresence>

      <div className="relative flex h-64 w-64 items-center justify-center rounded-full bg-[oklch(0.992_0.003_78)]/10">
        <Button
          variant="outline"
          size="lg"
          className="relative z-10 border-[oklch(0.992_0.003_78)]/50 bg-transparent font-serif font-light tracking-widest text-[oklch(0.992_0.003_78)] hover:bg-[oklch(0.992_0.003_78)]/10"
          onClick={() => setBurst((b) => b + 1)}
        >
          Entrer
        </Button>
      </div>

      {/* Config reference */}
      <div className="max-w-sm rounded-lg bg-[oklch(0.992_0.003_78)]/10 p-4 font-mono text-xs text-[oklch(0.992_0.003_78)]/70">
        <p className="mb-2 font-sans text-xs uppercase tracking-widest text-[oklch(0.992_0.003_78)]/50">
          DEFAULT_CONFETTI_CONFIG — edit in components/invitation/Confetti.tsx
        </p>
        {Object.entries(DEFAULT_CONFETTI_CONFIG).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <span className="text-[oklch(0.992_0.003_78)]/50">{k}</span>
            <span>{Array.isArray(v) ? v.join(", ") : String(v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
