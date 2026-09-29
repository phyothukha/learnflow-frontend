function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-") || "section"
  );
}

export function uniqueSlug(text: string, seen: Map<string, number>) {
  const base = slugify(text);
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count ? `${base}-${count}` : base;
}
