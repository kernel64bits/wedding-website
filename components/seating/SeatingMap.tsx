"use client";

interface Table {
  id: string;
  number: number;
  positionX: number;
  positionY: number;
}

interface SeatingMapProps {
  tables: Table[];
  guestTableNumber: number;
}

// Background image dimensions — viewBox must match these exactly
// so that positionX/Y pixel coordinates align with the image.
// Update these if the background image changes dimensions.
const VIEW_W = 1000;
const VIEW_H = 700;
const TABLE_RADIUS = 28;

export function SeatingMap({ tables, guestTableNumber }: SeatingMapProps) {
  return (
    <div className="overflow-auto rounded-lg border border-border">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="min-w-[600px] h-auto w-full"
        style={{ display: "block" }}
      >
        {/* Room background — replace /seating-bg.svg with the real venue image */}
        <image href="/seating-bg.svg" x={0} y={0} width={VIEW_W} height={VIEW_H} />

        {tables.map((table) => {
          const isGuest = table.number === guestTableNumber;
          return (
            <g key={table.id}>
              {/* Glow ring for the guest's table */}
              {isGuest && (
                <circle
                  cx={table.positionX}
                  cy={table.positionY}
                  r={TABLE_RADIUS + 10}
                  fill="currentColor"
                  fillOpacity={0.12}
                  className="text-primary"
                />
              )}
              <circle
                cx={table.positionX}
                cy={table.positionY}
                r={TABLE_RADIUS}
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
  );
}
