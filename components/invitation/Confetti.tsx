"use client";

import { memo, useMemo } from "react";
import { motion } from "motion/react";

// ── Config ────────────────────────────────────────────────────────────────────

export const DEFAULT_CONFETTI_CONFIG = {
  count:       400,
  minSpeed:    300,   // px/s
  maxSpeed:    1000,  // px/s
  gravity:     200,   // px/s²
  vertDrag:    1.0,   // vertical drag (1/s) — terminal velocity = gravity / vertDrag
  drag:        0.5,   // horizontal drag (1/s)
  angleSpread: 120,   // ° — ±60° from straight up
  maxRotate:   1440,  // ° — up to 4 rotations; faster spin → more lateral flutter
  minScale:    0.2,
  maxScale:    1.5,
  minDuration: 4.5,   // s
  maxDuration: 10,    // s
  maxDelay:    0.4,   // s — burst stagger window
  maxDrift:    140,   // px — max lateral wobble amplitude
  colors: ["#f5f0e8", "#d4c5a9", "#c4a882", "#e8ddd0", "#ffffff"],
};

export type ConfettiConfig = typeof DEFAULT_CONFETTI_CONFIG;

// ── Shapes ────────────────────────────────────────────────────────────────────

interface ShapeDef {
  width: number;
  height: number;
  borderRadius: number | string;
  clipPath?: string;
}

const SHAPES: ShapeDef[] = [
  { width: 6,  height: 14, borderRadius: 2 },
  { width: 8,  height: 8,  borderRadius: "50%" },
  { width: 11, height: 11, borderRadius: 0,
    clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" },
  { width: 10, height: 9,  borderRadius: 0,
    clipPath: "path('M 5,8.5 C 2.5,7 0,5.5 0,3.5 C 0,1.5 1.5,0 3,0 C 4,0 5,1 5,1 C 5,1 6,0 7,0 C 8.5,0 10,1.5 10,3.5 C 10,5.5 7.5,7 5,8.5 Z')" },
  { width: 8,  height: 10, borderRadius: 0,
    clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" },
  { width: 10, height: 9,  borderRadius: 0,
    clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" },
];

// ── Quasi-random helpers ──────────────────────────────────────────────────────

// Golden-ratio sequences — maximally equidistributed, deterministic
const G = [
  0.6180339887, // 0 angle
  0.7548776662, // 1 speed
  0.5698402910, // 2 scale
  0.4142135623, // 3 rotation
  0.3247179572, // 4 duration
  0.2360679774, // 5 drift amplitude
  0.1458980337, // 6 drift phase (second harmonic)
  0.8541019662, // 7 drift sign
  0.7071067812, // 8 launch delay
  0.4472135955, // 9 particle weight (terminal velocity multiplier)
];

const q    = (i: number, g: number) => (i * g) % 1;
const lerp = (t: number, lo: number, hi: number) => lo + t * (hi - lo);

// ── Physics ───────────────────────────────────────────────────────────────────

const STEPS         = 12;
const K_TIMES       = Array.from({ length: STEPS }, (_, s) => s / (STEPS - 1));
const INITIAL       = { x: 0, y: 0, rotate: 0, opacity: 0, scale: 1 } as const;
const OPACITY_TIMES: number[] = [0, 0.04, 0.6, 0.85, 1];

function buildParticles(cfg: ConfettiConfig) {
  const halfSpread = (cfg.angleSpread / 2) * (Math.PI / 180);
  const baseVterm  = cfg.gravity / cfg.vertDrag;

  return Array.from({ length: cfg.count }, (_, i) => {
    const angle      = -Math.PI / 2 + (q(i, G[0]) - 0.5) * 2 * halfSpread;
    const speed      = lerp(q(i, G[1]), cfg.minSpeed, cfg.maxSpeed);
    const vx         = speed * Math.cos(angle);
    const vy         = speed * Math.sin(angle);
    const duration   = lerp(q(i, G[4]), cfg.minDuration, cfg.maxDuration);
    const delay      = q(i, G[8]) * cfg.maxDelay;
    const vterm      = baseVterm * lerp(q(i, G[9]), 0.5, 1.6);
    const driftAmp   = q(i, G[5]) * cfg.maxDrift;
    const driftSign  = q(i, G[7]) > 0.5 ? 1 : -1;
    const driftPhase = q(i, G[6]);
    const rotate     = (q(i, G[3]) - 0.5) * cfg.maxRotate;
    const scale      = lerp(q(i, G[2]), cfg.minScale, cfg.maxScale);
    const driftFreq  = Math.max(0.3, Math.min((Math.abs(rotate) / 360) * 2, 4.5));
    const shape      = SHAPES[i % SHAPES.length];

    const xs: number[] = [];
    const ys: number[] = [];
    for (let s = 0; s < STEPS; s++) {
      const ti     = s / (STEPS - 1);
      const t      = ti * duration;
      const xDrag  = (vx / cfg.drag) * (1 - Math.exp(-cfg.drag * t));
      const yGrav  = vterm * t + (vy - vterm) / cfg.vertDrag * (1 - Math.exp(-cfg.vertDrag * t));
      const wobble = ti * driftSign * (
        driftAmp * 0.75 * Math.sin(driftFreq * Math.PI * Math.pow(ti, 0.8)) +
        driftAmp * 0.25 * Math.sin(driftFreq * 2.3 * Math.PI * ti + driftPhase * Math.PI * 2)
      );
      xs.push(xDrag + wobble);
      ys.push(yGrav);
    }

    return {
      id: i,
      style: {
        width:           shape.width,
        height:          shape.height,
        borderRadius:    shape.borderRadius,
        backgroundColor: cfg.colors[i % cfg.colors.length],
        ...(shape.clipPath && { clipPath: shape.clipPath }),
      },
      animate: {
        x:       xs,
        y:       ys,
        rotate:  [0, rotate * 0.4, rotate] as number[],
        opacity: [0, 1, 1, 0.8, 0] as number[],
        scale:   [1, 1, scale] as number[],
      },
      transition: {
        x:       { ease: "linear"  as const, times: K_TIMES,       duration, delay },
        y:       { ease: "linear"  as const, times: K_TIMES,       duration, delay },
        rotate:  { ease: "easeOut" as const, times: [0, 0.4, 1],   duration, delay },
        opacity: { ease: "linear"  as const, times: OPACITY_TIMES, duration, delay },
        scale:   { ease: "easeOut" as const, times: [0, 0.5, 1],   duration, delay },
      },
    };
  });
}

// ── Particle ──────────────────────────────────────────────────────────────────

type ParticleData = ReturnType<typeof buildParticles>[number];

const Particle = memo(function Particle({ style, animate, transition }: Omit<ParticleData, "id">) {
  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-1/2"
      style={style}
      initial={INITIAL}
      animate={animate}
      transition={transition}
    />
  );
});

// ── Confetti ──────────────────────────────────────────────────────────────────

/**
 * Fires a one-shot confetti burst from the center of the screen.
 * Re-fire by changing the `key` prop from the parent.
 *
 * @example
 * // fires once on mount
 * <Confetti />
 *
 * // re-fires on button click
 * const [n, setN] = useState(0);
 * <Confetti key={n} />
 * <button onClick={() => setN(n => n + 1)}>Fire</button>
 *
 * // override specific config values
 * <Confetti config={{ count: 200, colors: ["#ff0000"] }} />
 */
export function Confetti({ config }: { config?: Partial<ConfettiConfig> }) {
  const cfg       = useMemo(() => ({ ...DEFAULT_CONFETTI_CONFIG, ...config }), [config]);
  const particles = useMemo(() => buildParticles(cfg), [cfg]);

  return (
    <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
      {particles.map(({ id, ...p }) => (
        <Particle key={id} {...p} />
      ))}
    </div>
  );
}
