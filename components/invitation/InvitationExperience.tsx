"use client";

import { memo, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  type Variants,
} from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/invitation/Confetti";

// ── Constants ─────────────────────────────────────────────────────────────────

const SECTION_COUNT = 6;

/** Background colour per section index — shifts from dark welcome to warm cream. */
const SECTION_BG = [
  "oklch(0.52  0.082 55.7)", // welcome    — dark warm brown
  "oklch(0.992 0.003 78)",   // announcement — cream
  "oklch(0.965 0.012 60)",   // story        — warm gold
  "oklch(0.955 0.018 57)",   // details      — soft amber
  "oklch(0.945 0.022 54)",   // celebration  — warm beige
  "oklch(0.88  0.035 55.7)", // closing      — rich warm
] as const;

/**
 * Placeholder couple photos from Unsplash.
 * Replace with local /public assets before launch.
 */
const PHOTOS = {
  announcement:
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=840&q=80",
  story:
    "https://images.unsplash.com/photo-1606216174052-80eba2dd4e0e?w=840&q=80",
  details:
    "https://images.unsplash.com/photo-1465495976519-51ea89dd738d?w=840&q=80",
  celebration:
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=840&q=80",
};

// ── Animation variants ─────────────────────────────────────────────────────────

/**
 * Section enter/exit — direction-aware.
 * custom=1  → scrolling down (enter from below, exit upward)
 * custom=-1 → scrolling up   (enter from above, exit downward)
 */
const sectionVariants: Variants = {
  initial: (d: number) => ({ opacity: 0, y: d * 28 }),
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" },
  },
  exit: (d: number) => ({
    opacity: 0,
    y: d * -20,
    transition: { duration: 0.35, ease: "easeIn" },
  }),
};

/** Stagger container for child elements inside each section. */
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/** Individual text / photo element fade-up. */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

// ── Shared sub-components ──────────────────────────────────────────────────────

function Divider({ light = false }: { light?: boolean }) {
  return (
    <motion.div
      variants={fadeUp}
      className={`mx-auto my-8 h-px w-12 ${
        light
          ? "bg-[oklch(0.992_0.003_78)]/30"
          : "bg-[oklch(0.52_0.082_55.7)]/30"
      }`}
    />
  );
}

function Photo({
  src,
  alt,
  rotate = 1.5,
}: {
  src: string;
  alt: string;
  rotate?: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="shrink-0"
      style={{ rotate: `${rotate}deg` }}
    >
      <Image
        src={src}
        alt={alt}
        width={420}
        height={560}
        className="w-[260px] rounded-sm object-cover ring-1 ring-white/40
                   shadow-[0_20px_60px_oklch(0.52_0.082_55.7/0.28),0_4px_16px_oklch(0.52_0.082_55.7/0.12)]
                   md:w-[360px] xl:w-[420px]"
      />
    </motion.div>
  );
}

/** Wrapper that stagger-animates its children on mount. */
function SectionContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Sections ──────────────────────────────────────────────────────────────────

function WelcomeSection() {
  const t = useTranslations("invitation");
  return (
    <SectionContent className="flex flex-col items-center text-center">
      <motion.div
        variants={fadeUp}
        className="flex items-baseline gap-3 font-serif text-5xl font-light
                   text-[oklch(0.992_0.003_78)] md:text-7xl"
      >
        <span>Sophie</span>
        <span className="text-[oklch(0.992_0.003_78)]/50">&</span>
        <span>John</span>
      </motion.div>

      <Divider light />

      <motion.p
        variants={fadeUp}
        className="font-serif text-sm uppercase tracking-[0.3em]
                   text-[oklch(0.992_0.003_78)]/60"
      >
        {t("saveTheDate.label")} · {t("saveTheDate.date")}
      </motion.p>

      <motion.p
        variants={fadeUp}
        className="mt-12 animate-bounce text-xl text-[oklch(0.992_0.003_78)]/40"
      >
        ↓
      </motion.p>
    </SectionContent>
  );
}

function AnnouncementSection() {
  const t = useTranslations("invitation");
  return (
    <SectionContent className="flex items-center gap-16 md:gap-28">
      <Photo src={PHOTOS.announcement} alt="Couple portrait" rotate={1.5} />
      <div className="max-w-sm">
        <motion.h2
          variants={fadeUp}
          className="font-serif text-4xl font-light text-[oklch(0.52_0.082_55.7)]
                     md:text-5xl xl:text-6xl"
        >
          {t("announcement.heading")}
        </motion.h2>
        <Divider />
        <motion.p
          variants={fadeUp}
          className="font-serif text-xl font-light leading-relaxed text-[oklch(0.502_0_0)]"
        >
          {t("announcement.body")}
        </motion.p>
      </div>
    </SectionContent>
  );
}

function StorySection() {
  const t = useTranslations("invitation");
  return (
    <SectionContent className="flex flex-row-reverse items-center gap-16 md:gap-28">
      <Photo src={PHOTOS.story} alt="Couple walking together" rotate={-1.5} />
      <div className="max-w-sm text-right">
        <motion.h2
          variants={fadeUp}
          className="font-serif text-4xl font-light text-[oklch(0.52_0.082_55.7)]
                     md:text-5xl xl:text-6xl"
        >
          {t("story.heading")}
        </motion.h2>
        <Divider />
        <motion.p
          variants={fadeUp}
          className="font-serif text-xl font-light leading-relaxed text-[oklch(0.502_0_0)]"
        >
          {t("story.body")}
        </motion.p>
      </div>
    </SectionContent>
  );
}

function DetailsSection() {
  const t = useTranslations("invitation");
  return (
    <SectionContent className="flex items-center gap-16 md:gap-28">
      <Photo src={PHOTOS.details} alt="Couple laughing" rotate={1.5} />
      <div className="max-w-sm">
        <motion.h2
          variants={fadeUp}
          className="font-serif text-3xl font-light text-[oklch(0.52_0.082_55.7)]
                     md:text-4xl xl:text-5xl"
        >
          {t("details.heading")}
        </motion.h2>
        <Divider />
        <motion.dl variants={fadeUp} className="space-y-5 font-serif">
          <div>
            <dt className="text-xs uppercase tracking-widest text-[oklch(0.502_0_0)]">
              {t("details.dateLabel")}
            </dt>
            <dd className="mt-1 text-2xl font-light text-[oklch(0.267_0_0)]">
              {t("details.date")}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-[oklch(0.502_0_0)]">
              {t("details.timeLabel")}
            </dt>
            <dd className="mt-1 text-2xl font-light text-[oklch(0.267_0_0)]">
              {t("details.time")}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-[oklch(0.502_0_0)]">
              {t("details.venueLabel")}
            </dt>
            <dd className="mt-1 text-2xl font-light text-[oklch(0.267_0_0)]">
              {t("details.venueName")}
            </dd>
            <dd className="mt-1 text-sm text-[oklch(0.502_0_0)]">
              {t("details.address")}
            </dd>
          </div>
        </motion.dl>
      </div>
    </SectionContent>
  );
}

function CelebrationSection() {
  const t = useTranslations("invitation");
  return (
    <SectionContent className="flex flex-row-reverse items-center gap-16 md:gap-28">
      <Photo src={PHOTOS.celebration} alt="Couple dancing" rotate={-1.5} />
      <div className="max-w-sm text-right">
        <motion.h2
          variants={fadeUp}
          className="font-serif text-4xl font-light text-[oklch(0.52_0.082_55.7)]
                     md:text-5xl xl:text-6xl"
        >
          {t("celebration.heading")}
        </motion.h2>
        <Divider />
        <motion.p
          variants={fadeUp}
          className="font-serif text-xl font-light leading-relaxed text-[oklch(0.502_0_0)]"
        >
          {t("celebration.body")}
        </motion.p>
      </div>
    </SectionContent>
  );
}

function ClosingSection() {
  const t = useTranslations("invitation");
  return (
    <SectionContent className="flex flex-col items-center text-center">
      <motion.h2
        variants={fadeUp}
        className="font-serif text-4xl font-light text-[oklch(0.52_0.082_55.7)]
                   md:text-6xl xl:text-7xl"
      >
        {t("closing.heading")}
      </motion.h2>
      <Divider />
      <motion.p
        variants={fadeUp}
        className="font-serif text-xl font-light text-[oklch(0.502_0_0)]"
      >
        {t("closing.body")}
      </motion.p>
      <motion.div variants={fadeUp} className="mt-10">
        <Button
          asChild
          variant="outline"
          size="lg"
          className="border-[oklch(0.52_0.082_55.7)]/50 font-serif text-base font-light
                     tracking-widest text-[oklch(0.52_0.082_55.7)]
                     hover:bg-[oklch(0.52_0.082_55.7)]/10"
        >
          <Link href="/home">{t("closing.cta")}</Link>
        </Button>
      </motion.div>
    </SectionContent>
  );
}

// ── Scroll progress bar ───────────────────────────────────────────────────────

const ScrollProgressBar = memo(function ScrollProgressBar({
  active,
}: {
  active: number;
}) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex h-[2px] gap-px">
      {Array.from({ length: SECTION_COUNT }, (_, i) => (
        <motion.div
          key={i}
          className="h-full flex-1 bg-[oklch(0.992_0.003_78)]"
          animate={{ opacity: i <= active ? 0.9 : 0.2 }}
          transition={{ duration: 0.4 }}
        />
      ))}
    </div>
  );
});

// ── Main experience ───────────────────────────────────────────────────────────

interface InvitationExperienceProps {
  invitationId: string | null;
}

export function InvitationExperience({
  invitationId,
}: InvitationExperienceProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);

  // Refs for values read inside the scroll event handler to avoid stale closures
  const activeSectionRef = useRef(0);
  const confettiFiredRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Memoised section elements — only ClosingSection depends on locale
  const sections = useMemo(
    () => [
      <WelcomeSection key="welcome" />,
      <AnnouncementSection key="announcement" />,
      <StorySection key="story" />,
      <DetailsSection key="details" />,
      <CelebrationSection key="celebration" />,
      <ClosingSection key="closing" />,
    ],
    [],
  );

  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(
      SECTION_COUNT - 1,
      Math.round(v * (SECTION_COUNT - 1)),
    );
    const prev = activeSectionRef.current;
    if (idx === prev) return;

    // Fire confetti once on the first scroll away from the welcome section
    if (prev === 0 && idx > 0 && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      setShowConfetti(true);
      if (invitationId) {
        fetch("/api/invitation/viewed", { method: "PATCH" }).catch(() => {});
      }
    }

    activeSectionRef.current = idx;
    setDirection(idx > prev ? 1 : -1);
    setActiveSection(idx);
  });

  return (
    <main>
      {/* Confetti at the root — never inside any animating container */}
      {showConfetti && <Confetti />}

      {/* Shifting ambient background — fixed, behind everything */}
      <motion.div
        className="fixed inset-0 -z-10"
        animate={{ backgroundColor: SECTION_BG[activeSection] }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
      />

      <ScrollProgressBar active={activeSection} />

      {/* Scroll zone — each section gets ~100vh of scroll distance */}
      <div
        ref={scrollRef}
        style={{ height: `${(SECTION_COUNT + 1) * 100}vh` }}
      >
        {/* Sticky viewport */}
        <div className="sticky top-0 flex h-screen items-center justify-center px-6">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={activeSection}
              custom={direction}
              variants={sectionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {sections[activeSection]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
