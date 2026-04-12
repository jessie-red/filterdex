import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { PNG } from "pngjs";
import type { Plugin } from "vite";
import {
  extractBuckets,
  selectPalette,
  paletteToHex,
} from "../src/core/palette.ts";

const VIRTUAL_ID = "virtual:palettes";
const RESOLVED_ID = "\0" + VIRTUAL_ID;

export default function palettesPlugin(): Plugin {
  let json: string;

  return {
    name: "palettes",

    buildStart() {
      const spriteDir = join(import.meta.dirname!, "..", "sprites");
      const files = readdirSync(spriteDir).filter((f) => f.endsWith(".png"));
      const palettes: Record<string, ReturnType<typeof paletteToHex>> = {};

      for (const file of files) {
        const id = file.replace(".png", "");
        const buf = readFileSync(join(spriteDir, file));
        const { data, width, height } = PNG.sync.read(buf);
        const buckets = extractBuckets(data, width * height);
        const palette = selectPalette(buckets);
        palettes[id] = paletteToHex(palette);
      }

      json = JSON.stringify(palettes);
    },

    resolveId(id: string) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },

    load(id: string) {
      if (id === RESOLVED_ID) return `export default ${json};`;
    },
  };
}
