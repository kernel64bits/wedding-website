import { setRequestLocale } from "next-intl/server";

// Positions A/B: 0–100 coordinate space
const MOCK_TABLES_AB = [
  { number: 1, positionX: 20, positionY: 22 },
  { number: 2, positionX: 40, positionY: 18 },
  { number: 3, positionX: 60, positionY: 22 },
  { number: 4, positionX: 80, positionY: 22 },
  { number: 5, positionX: 20, positionY: 58 },
  { number: 6, positionX: 40, positionY: 62 }, // guest's table
  { number: 7, positionX: 60, positionY: 58 },
  { number: 8, positionX: 80, positionY: 58 },
];

// Positions C: pixel coordinates in the 1000×700 background image space
const MOCK_TABLES_C = [
  { number: 1, positionX: 160, positionY: 220 },
  { number: 2, positionX: 360, positionY: 200 },
  { number: 3, positionX: 560, positionY: 200 },
  { number: 4, positionX: 760, positionY: 220 },
  { number: 5, positionX: 160, positionY: 420 },
  { number: 6, positionX: 360, positionY: 440 }, // guest's table
  { number: 7, positionX: 560, positionY: 440 },
  { number: 8, positionX: 760, positionY: 420 },
];

const MOCK_NAMES: Record<number, string[]> = {
  1: ["Marie D.", "Luc D."],
  2: ["Sophie", "John"],
  3: ["Anna B.", "Marc B."],
  4: ["Claire R.", "Pierre R."],
  5: ["Julie M.", "Paul M."],
  6: ["Vous", "Emma L.", "Tom L."],
  7: ["Lucie V.", "Hugo V."],
  8: ["Isabelle C.", "Nicolas C."],
};

const GUEST_TABLE = 6;

export default async function SeatingOptionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="min-h-screen bg-neutral-200 px-8 py-16 space-y-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-neutral-800">Seating map — visual options</h1>
        <p className="text-sm text-neutral-500">
          Mock data — Table 6 is the guest&apos;s table (highlighted). Choose an option or mix elements.
        </p>
      </div>

      {/* Option A */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-800">Option A — Minimal</h2>
          <p className="text-sm text-neutral-500">Circles with table numbers only. Clean, fast to scan.</p>
        </div>
        <div className="bg-background rounded-2xl p-6">
          <div className="overflow-auto">
            <svg viewBox="0 0 100 80" className="min-w-[500px] h-auto w-full" style={{ display: "block" }}>
              {MOCK_TABLES_AB.map((table) => {
                const isGuest = table.number === GUEST_TABLE;
                return (
                  <g key={table.number}>
                    <circle
                      cx={table.positionX}
                      cy={table.positionY}
                      r={5}
                      className={isGuest ? "fill-primary" : "fill-muted"}
                      stroke="currentColor"
                      strokeWidth={0.3}
                      strokeOpacity={0.2}
                    />
                    <text
                      x={table.positionX}
                      y={table.positionY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={3}
                      className={isGuest ? "fill-primary-foreground" : "fill-foreground"}
                      fontWeight={isGuest ? "600" : "400"}
                    >
                      {table.number}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary align-middle mr-1" />
            Your table
          </p>
        </div>
      </section>

      {/* Option B */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-800">Option B — With attendee names</h2>
          <p className="text-sm text-neutral-500">Each table shows who is seated there. Full social context.</p>
        </div>
        <div className="bg-background rounded-2xl p-6">
          <div className="overflow-auto">
            <svg viewBox="0 0 100 100" className="min-w-[500px] h-auto w-full" style={{ display: "block" }}>
              {MOCK_TABLES_AB.map((table) => {
                const isGuest = table.number === GUEST_TABLE;
                const names = MOCK_NAMES[table.number] ?? [];
                return (
                  <g key={table.number}>
                    <circle
                      cx={table.positionX}
                      cy={table.positionY}
                      r={4.5}
                      className={isGuest ? "fill-primary" : "fill-muted"}
                      stroke="currentColor"
                      strokeWidth={0.3}
                      strokeOpacity={0.2}
                    />
                    <text
                      x={table.positionX}
                      y={table.positionY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={2.8}
                      className={isGuest ? "fill-primary-foreground" : "fill-foreground"}
                      fontWeight={isGuest ? "600" : "400"}
                    >
                      {table.number}
                    </text>
                    {names.map((name, i) => (
                      <text
                        key={i}
                        x={table.positionX}
                        y={table.positionY + 6.5 + i * 2.2}
                        textAnchor="middle"
                        fontSize={1.6}
                        className={isGuest ? "fill-primary font-medium" : "fill-muted-foreground"}
                      >
                        {name}
                      </text>
                    ))}
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary align-middle mr-1" />
            Your table
          </p>
        </div>
      </section>

      {/* Option C */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-800">Option C — Background image + overlaid tables</h2>
          <p className="text-sm text-neutral-500">
            Room floor plan as background image. Table circles overlaid in SVG using pixel coordinates matching the image.
            Replace <code className="bg-neutral-200 px-1 rounded text-xs">/public/seating-bg.svg</code> with the real venue image.
          </p>
        </div>
        <div className="bg-background rounded-2xl p-6">
          <div className="overflow-auto rounded-lg border border-border">
            {/* viewBox matches the background image dimensions (1000×700) */}
            <svg viewBox="0 0 1000 700" className="min-w-[600px] h-auto w-full" style={{ display: "block" }}>
              {/* Background room image */}
              <image href="/seating-bg.svg" x={0} y={0} width={1000} height={700} />

              {/* Table circles — positions are pixel coords in the 1000×700 space */}
              {MOCK_TABLES_C.map((table) => {
                const isGuest = table.number === GUEST_TABLE;
                return (
                  <g key={table.number}>
                    {/* Glow ring for guest table */}
                    {isGuest && (
                      <circle cx={table.positionX} cy={table.positionY} r={36} fill="currentColor" fillOpacity={0.12} className="text-primary" />
                    )}
                    <circle
                      cx={table.positionX}
                      cy={table.positionY}
                      r={28}
                      className={isGuest ? "fill-primary" : "fill-background"}
                      stroke="currentColor"
                      strokeWidth={isGuest ? 0 : 1.5}
                      strokeOpacity={0.25}
                    />
                    <text
                      x={table.positionX}
                      y={table.positionY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={18}
                      className={isGuest ? "fill-primary-foreground" : "fill-foreground"}
                      fontWeight={isGuest ? "600" : "400"}
                    >
                      {table.number}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary align-middle mr-1" />
            Your table &nbsp;·&nbsp; placeholder background — replace with real venue image
          </p>
        </div>
      </section>
    </main>
  );
}
