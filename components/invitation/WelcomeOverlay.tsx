"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/invitation/Confetti";

interface WelcomeOverlayProps {
  show: boolean;
  onEnter: () => void;
}

export function WelcomeOverlay({ show, onEnter }: WelcomeOverlayProps) {
  const t = useTranslations("invitation");
  const [showConfetti, setShowConfetti] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up pending timer if the overlay unmounts before it fires
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleEnter() {
    setShowConfetti(true);
    timerRef.current = setTimeout(onEnter, 400);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          style={{ backgroundColor: "oklch(0.52 0.082 55.7)" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        >
          {/* Confetti fires on Enter and persists through the 0.9s fade-out */}
          {showConfetti && <Confetti />}

          {/* Couple names — split entrance */}
          <div className="flex items-baseline gap-3 font-serif text-5xl font-light text-[oklch(0.992_0.003_78)] md:text-7xl">
            <motion.span
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            >
              Sophie
            </motion.span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.6 }}
              className="text-[oklch(0.992_0.003_78)]/50"
            >
              &
            </motion.span>
            <motion.span
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            >
              John
            </motion.span>
          </div>

          {/* Divider */}
          <motion.div
            className="my-8 h-px w-16 origin-left bg-[oklch(0.992_0.003_78)]/30"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
          />

          {/* Save the date label */}
          <motion.p
            className="mb-8 font-serif text-sm uppercase tracking-[0.3em] text-[oklch(0.992_0.003_78)]/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
          >
            {t("saveTheDate.label")}
          </motion.p>

          {/* Enter button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.6 }}
          >
            <Button
              variant="outline"
              size="lg"
              className="border-[oklch(0.992_0.003_78)]/50 bg-transparent font-serif text-base font-light tracking-widest text-[oklch(0.992_0.003_78)] hover:bg-[oklch(0.992_0.003_78)]/10"
              onClick={handleEnter}
            >
              {t("enter")}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
