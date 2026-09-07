/**
 * Tiny dependency-free fuzzy matcher for the Global Command Palette.
 *
 * `fuzzyScore` is a subsequence match: every query char must appear in
 * order in the target. Contiguous runs, word-boundary hits, and prefix
 * hits score higher so "mou" ranks "MOUs (Marketing)" above "Documents".
 * Returns -1 when the query does not match at all.
 */
export function fuzzyScore(query: string, target: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const t = target.toLowerCase();

  // Fast path: exact substring beats any scattered subsequence.
  const sub = t.indexOf(q);
  if (sub !== -1) {
    return 1000 - sub * 10 - (t.length - q.length);
  }

  let score = 0;
  let tIdx = 0;
  let run = 0;
  const isBoundary = (i: number) =>
    i === 0 || /[\s/_.-]/.test(t[i - 1] ?? "");

  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi];
    const found = t.indexOf(ch, tIdx);
    if (found === -1) return -1;
    if (found === tIdx) {
      run += 1;
      score += 10 + run * 5; // contiguous run bonus
    } else {
      run = 0;
      score += 5;
    }
    if (isBoundary(found)) score += 8;
    // Penalize distance skipped between matched chars.
    score -= Math.min(found - tIdx, 20);
    tIdx = found + 1;
  }

  // Shorter targets are more specific; prefer them on ties.
  score -= Math.max(t.length - q.length, 0) * 0.1;
  return score;
}

/**
 * Ranks items by the best fuzzy score across their haystack strings.
 * Empty query returns items in original order (up to `limit`).
 */
export function fuzzyFilter<T>(
  query: string,
  items: T[],
  haystacks: (item: T) => (string | undefined | null)[],
  limit = 50,
): T[] {
  const q = query.trim();
  if (!q) return items.slice(0, limit);
  const scored: { item: T; score: number }[] = [];
  for (const item of items) {
    let best = -Infinity;
    for (const h of haystacks(item)) {
      if (!h) continue;
      const s = fuzzyScore(q, h);
      if (s > best) best = s;
    }
    if (best > -Infinity && best >= 0) scored.push({ item, score: best });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
}
