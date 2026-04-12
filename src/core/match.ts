export type WordMatch = {
  word: string;
  display: string;
  match: number;
};

export const MIN_SCORE = 60;

export function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

export function matchWord(word: string, options: string[]): WordMatch | null {
  const input = normalize(word);
  if (input.length === 0) return null;

  let bestWord: string | null = null;
  let bestDisplay: string | null = null;
  let bestScore = -1;

  for (const option of options) {
    const norm = normalize(option);

    if (input === norm) {
      return { word: norm, display: option, match: 100 };
    }

    if (norm.startsWith(input)) {
      const score = Math.round((input.length / norm.length) * 100);
      if (score > bestScore) {
        bestScore = score;
        bestWord = norm;
        bestDisplay = option;
      }
      continue;
    }

    const dist = levenshtein(input, norm);
    const maxLen = Math.max(input.length, norm.length);
    const score = Math.max(0, 100 - Math.round((dist / maxLen) * 100));
    if (score > bestScore) {
      bestScore = score;
      bestWord = norm;
      bestDisplay = option;
    }
  }

  if (bestWord === null || bestDisplay === null || bestScore < MIN_SCORE)
    return null;
  return { word: bestWord, display: bestDisplay, match: bestScore };
}
