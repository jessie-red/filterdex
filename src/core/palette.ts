export type RGB = [number, number, number];
export type HSL = [number, number, number];

export type ColorBucket = { rgb: RGB; count: number };

export type HueCluster = {
  hue: number;
  totalCount: number;
  buckets: ColorBucket[];
  avgH: number;
  avgS: number;
  avgL: number;
};

export interface Palette {
  bg: RGB;
  accent: RGB;
  text: RGB;
  textMuted: RGB;
}

export interface HexPalette {
  bg: string;
  bgRaised: string;
  accent: string;
  accentHover: string;
  text: string;
  textMuted: string;
  border: string;
  borderSubtle: string;
}

// --- color math ---

const toLinear = (c: number): number => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

const luminance = ([r, g, b]: RGB): number =>
  0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

const contrastRatio = (a: RGB, b: RGB): number => {
  const la = luminance(a);
  const lb = luminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
};

export const rgbToHsl = ([r, g, b]: RGB): HSL => {
  const rs = r / 255,
    gs = g / 255,
    bs = b / 255;
  const max = Math.max(rs, gs, bs),
    min = Math.min(rs, gs, bs);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rs) h = ((gs - bs) / d + (gs < bs ? 6 : 0)) / 6;
  else if (max === gs) h = ((bs - rs) / d + 2) / 6;
  else h = ((rs - gs) / d + 4) / 6;
  return [h, s, l];
};

export const hslToRgb = ([h, s, l]: HSL): RGB => {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    const tt = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
};

export const toHex = ([r, g, b]: RGB): string =>
  "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");

// --- pixel extraction + quantization ---

const QUANT_STEP = 16;
const quantize = (v: number): number =>
  Math.min(255, Math.round(v / QUANT_STEP) * QUANT_STEP);

export function extractBuckets(
  data: ArrayLike<number>,
  pixelCount: number,
): ColorBucket[] {
  const counts = new Map<string, { rgb: RGB; count: number }>();
  for (let i = 0; i < pixelCount; i++) {
    const off = i * 4;
    if (data[off + 3] < 128) continue;
    const rgb: RGB = [
      quantize(data[off]),
      quantize(data[off + 1]),
      quantize(data[off + 2]),
    ];
    const key = rgb.join(",");
    const entry = counts.get(key);
    if (entry) entry.count++;
    else counts.set(key, { rgb, count: 1 });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

// --- palette helpers ---

export const adjustLightness = (rgb: RGB, targetL: number): RGB => {
  const [h, s] = rgbToHsl(rgb);
  return hslToRgb([h, s, targetL]);
};

const deriveText = (sourceRgb: RGB, bg: RGB): { text: RGB; textMuted: RGB } => {
  const [dh, ds] = rgbToHsl(sourceRgb);
  let text = hslToRgb([dh, ds * 0.15, 0.92]);
  if (contrastRatio(text, bg) < 4.5) {
    text = hslToRgb([dh, ds * 0.1, 0.95]);
  }
  let textMuted = hslToRgb([dh, ds * 0.6, 0.55]);
  if (contrastRatio(textMuted, bg) < 3) {
    textMuted = hslToRgb([dh, ds * 0.5, 0.62]);
  }
  return { text, textMuted };
};

const deriveMutedFromHue = (h: number, s: number, bg: RGB): RGB => {
  let textMuted = hslToRgb([h, s * 0.7, 0.55]);
  if (contrastRatio(textMuted, bg) < 3) {
    textMuted = hslToRgb([h, s * 0.6, 0.62]);
  }
  return textMuted;
};

const accentScore = (bucket: ColorBucket): number => {
  const [, s, l] = rgbToHsl(bucket.rgb);
  return s * (1 - Math.abs(l - 0.5)) * Math.log(bucket.count + 1);
};

const ensureAccentContrast = (accent: RGB, bg: RGB): RGB => {
  const [h, s, l] = rgbToHsl(accent);
  const boostedS = Math.min(1, s * 1.3);
  const clampedL = Math.max(0.4, Math.min(0.65, l));
  accent = hslToRgb([h, boostedS, clampedL]);
  if (contrastRatio(accent, bg) < 3) {
    accent = hslToRgb([h, boostedS, 0.6]);
  }
  return accent;
};

// --- frequency method (fallback) ---

const selectFrequency = (buckets: ColorBucket[]): Palette => {
  const fallback: Palette = {
    bg: [26, 26, 46],
    accent: [233, 69, 96],
    text: [238, 238, 255],
    textMuted: [136, 136, 170],
  };
  if (buckets.length === 0) return fallback;

  const dominant = buckets[0].rgb;
  const bg = adjustLightness(dominant, 0.12);
  const candidates = buckets.slice(0, Math.min(buckets.length, 20));
  const accentBucket = candidates.reduce((best, cur) =>
    accentScore(cur) > accentScore(best) ? cur : best,
  );
  const accent = ensureAccentContrast(accentBucket.rgb, bg);
  const { text, textMuted } = deriveText(dominant, bg);
  return { bg, accent, text, textMuted };
};

// --- hue clustering ---

const HUE_BUCKETS = 12;
const SIGNIFICANT_THRESHOLD = 0.1;
const TRIM_MIN = 0.02;
const TRIM_HUE_RANGE = 60;

const isChromatic = (rgb: RGB): boolean => {
  const [, s, l] = rgbToHsl(rgb);
  return s > 0.15 && l > 0.1 && l < 0.92;
};

const buildCluster = (bs: ColorBucket[]): Omit<HueCluster, "hue"> => {
  const totalCount = bs.reduce((s, b) => s + b.count, 0);
  let sinSum = 0,
    cosSum = 0,
    wS = 0,
    wL = 0;
  for (const b of bs) {
    const [h, s, l] = rgbToHsl(b.rgb);
    const angle = h * 2 * Math.PI;
    sinSum += Math.sin(angle) * b.count;
    cosSum += Math.cos(angle) * b.count;
    wS += s * b.count;
    wL += l * b.count;
  }
  let avgH = Math.atan2(sinSum, cosSum) / (2 * Math.PI);
  if (avgH < 0) avgH += 1;
  return {
    totalCount,
    buckets: bs,
    avgH,
    avgS: wS / totalCount,
    avgL: wL / totalCount,
  };
};

export function clusterByHue(buckets: ColorBucket[]): HueCluster[] {
  const bins = new Map<number, ColorBucket[]>();
  for (const b of buckets) {
    if (!isChromatic(b.rgb)) continue;
    const [h] = rgbToHsl(b.rgb);
    const bin = Math.floor(h * HUE_BUCKETS) % HUE_BUCKETS;
    const list = bins.get(bin) ?? [];
    list.push(b);
    bins.set(bin, list);
  }

  const sortedBins = [...bins.entries()].sort((a, b) => a[0] - b[0]);
  const merged: { hue: number; colors: ColorBucket[] }[] = [];
  for (const [bin, colors] of sortedBins) {
    const prev = merged.at(-1);
    const adjacent =
      prev !== undefined &&
      (bin - prev.hue === 1 || (prev.hue === HUE_BUCKETS - 1 && bin === 0));
    if (adjacent) {
      prev!.colors.push(...colors);
    } else {
      merged.push({ hue: bin, colors: [...colors] });
    }
  }
  if (
    merged.length >= 2 &&
    merged.at(-1)!.hue === HUE_BUCKETS - 1 &&
    merged[0].hue === 0
  ) {
    merged[0].colors.push(...merged.pop()!.colors);
  }

  return merged
    .map((m) => ({ hue: m.hue, ...buildCluster(m.colors) }))
    .sort((a, b) => b.totalCount - a.totalCount);
}

export function significantClusters(clusters: HueCluster[]): HueCluster[] {
  const totalChromatic = clusters.reduce((s, c) => s + c.totalCount, 0);
  if (totalChromatic === 0) return [];
  return clusters.filter(
    (c) => c.totalCount / totalChromatic >= SIGNIFICANT_THRESHOLD,
  );
}

const hueDistance = (a: number, b: number): number => {
  const d = Math.abs(a - b) * 360;
  return Math.min(d, 360 - d);
};

export function findTrim(
  primary: HueCluster,
  allClusters: HueCluster[],
): HueCluster | undefined {
  const totalChromatic = allClusters.reduce((s, c) => s + c.totalCount, 0);
  if (totalChromatic === 0) return undefined;
  return allClusters.find((c) => {
    if (c === primary) return false;
    const frac = c.totalCount / totalChromatic;
    if (frac < TRIM_MIN) return false;
    const dist = hueDistance(primary.avgH, c.avgH);
    return Math.abs(dist - 180) <= TRIM_HUE_RANGE;
  });
}

// --- palette selection methods ---

const bgFromCluster = (cluster: HueCluster): { bgSource: RGB; bg: RGB } => {
  const bgSource = hslToRgb([cluster.avgH, cluster.avgS, cluster.avgL]);
  return { bgSource, bg: adjustLightness(bgSource, 0.12) };
};

const accentFromCluster = (cluster: HueCluster, bg: RGB): RGB => {
  const source = hslToRgb([cluster.avgH, cluster.avgS, cluster.avgL]);
  return ensureAccentContrast(source, bg);
};

const selectSingleHue = (
  cluster: HueCluster,
  allClusters: HueCluster[],
): Palette => {
  const { bgSource, bg } = bgFromCluster(cluster);
  const accentBucket = cluster.buckets.reduce((best, cur) =>
    accentScore(cur) > accentScore(best) ? cur : best,
  );
  const accent = ensureAccentContrast(accentBucket.rgb, bg);
  const { text } = deriveText(bgSource, bg);
  const trim = findTrim(cluster, allClusters);
  const textMuted = trim
    ? deriveMutedFromHue(trim.avgH, trim.avgS, bg)
    : deriveText(bgSource, bg).textMuted;
  return { bg, accent, text, textMuted };
};

const selectDualHue = (primary: HueCluster, secondary: HueCluster): Palette => {
  const { bgSource, bg } = bgFromCluster(primary);
  const accent = accentFromCluster(secondary, bg);
  const { text, textMuted } = deriveText(bgSource, bg);
  return { bg, accent, text, textMuted };
};

const selectTriHue = (
  primary: HueCluster,
  secondary: HueCluster,
  tertiary: HueCluster,
): Palette => {
  const { bgSource, bg } = bgFromCluster(primary);
  const accent = accentFromCluster(secondary, bg);
  const { text } = deriveText(bgSource, bg);
  const textMuted = deriveMutedFromHue(tertiary.avgH, tertiary.avgS, bg);
  return { bg, accent, text, textMuted };
};

export function selectPalette(buckets: ColorBucket[]): Palette {
  const clusters = clusterByHue(buckets);
  const significant = significantClusters(clusters);

  let palette: Palette;
  if (significant.length === 1)
    palette = selectSingleHue(significant[0], clusters);
  else if (significant.length === 2)
    palette = selectDualHue(significant[0], significant[1]);
  else if (significant.length === 3)
    palette = selectTriHue(significant[0], significant[1], significant[2]);
  else palette = selectFrequency(buckets);

  return fixMutedIfNeeded(palette);
}

// if muted text is too close to bg (same hue, low contrast), use accent hue instead
function fixMutedIfNeeded(palette: Palette): Palette {
  const [bgH] = rgbToHsl(palette.bg);
  const [mutedH, mutedS] = rgbToHsl(palette.textMuted);
  const hueDist = Math.abs(bgH - mutedH) * 360;
  const hueClose = Math.min(hueDist, 360 - hueDist) < 30;
  const lowContrast = contrastRatio(palette.textMuted, palette.bg) < 6;
  const lowSat = mutedS < 0.3;

  if (hueClose && (lowContrast || lowSat)) {
    const [accentH, accentS] = rgbToHsl(palette.accent);
    const textMuted = deriveMutedFromHue(accentH, accentS, palette.bg);
    return { ...palette, textMuted };
  }
  return palette;
}

export function paletteToHex(palette: Palette): HexPalette {
  return {
    bg: toHex(palette.bg),
    bgRaised: toHex(adjustLightness(palette.bg, 0.18)),
    accent: toHex(palette.accent),
    accentHover: toHex(adjustLightness(palette.accent, 0.45)),
    text: toHex(palette.text),
    textMuted: toHex(palette.textMuted),
    border: toHex(adjustLightness(palette.bg, 0.25)),
    borderSubtle: toHex(adjustLightness(palette.bg, 0.2)),
  };
}
