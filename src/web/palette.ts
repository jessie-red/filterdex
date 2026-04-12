import palettes from "virtual:palettes";
import type { HexPalette } from "../core/palette.ts";
import type { Pokemon } from "../core/pokemon.ts";
import { ScryDex } from "../core/dex.ts";

function applyHexPalette(p: HexPalette): void {
  const root = document.documentElement;
  root.style.setProperty("--bg", p.bg);
  root.style.setProperty("--bg-raised", p.bgRaised);
  root.style.setProperty("--accent", p.accent);
  root.style.setProperty("--accent-hover", p.accentHover);
  root.style.setProperty("--text", p.text);
  root.style.setProperty("--text-muted", p.textMuted);
  root.style.setProperty("--border", p.border);
  root.style.setProperty("--border-subtle", p.borderSubtle);
}

export function randomPokemonWithPalette(): Pokemon {
  let p;
  do {
    p = ScryDex[Math.floor(Math.random() * ScryDex.length)];
  } while (!(p.spriteid in palettes));
  return p;
}

export function applyPaletteForSprite(spriteid: string): void {
  const palette = palettes[spriteid];
  if (palette) applyHexPalette(palette);
}
