export const DIETARY_SLUGS = ["vegan", "gluten-free", "nuts"] as const;
export type DietarySlug = (typeof DIETARY_SLUGS)[number];

export function parseDietary(raw: string | null): { slugs: DietarySlug[]; other: string } {
  if (!raw) return { slugs: [], other: "" };
  const parts = raw.split(",");
  const slugs: DietarySlug[] = [];
  let other = "";
  for (const p of parts) {
    if (p.startsWith("other:")) {
      other = p.slice(6);
    } else if (DIETARY_SLUGS.includes(p as DietarySlug)) {
      slugs.push(p as DietarySlug);
    }
  }
  return { slugs, other };
}

export function serializeDietary(slugs: DietarySlug[], other: string): string {
  const parts: string[] = [...slugs];
  const trimmed = other.trim();
  if (trimmed) parts.push(`other:${trimmed}`);
  return parts.join(",");
}
