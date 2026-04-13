import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { PNG } from "pngjs";
import type { Plugin } from "vite";
import {
  extractBuckets,
  selectPalette,
  paletteToHex,
} from "../core/palette.ts";

const VIRTUAL_ID = "virtual:palettes";
const RESOLVED_ID = "\0" + VIRTUAL_ID;

function ensureSprites(spriteDir: string): void {
  const hasSprites =
    existsSync(spriteDir) &&
    readdirSync(spriteDir).some((f) => f.endsWith(".png"));
  if (hasSprites) return;

  console.log("Sprites not found, downloading...");
  const script = join(import.meta.dirname!, "scrapeSprites.ts");
  execFileSync("node", [script], { stdio: "inherit" });
}

export default function palettesPlugin(): Plugin {
  let json: string;

  return {
    name: "palettes",

    buildStart() {
      const spriteDir = join(
        import.meta.dirname!,
        "..",
        "..",
        "buildData",
        "sprites",
      );
      ensureSprites(spriteDir);
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

    resolveId(id: string): string | null {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },

    load(id: string): string | null {
      return id === RESOLVED_ID ? `export default ${json};` : null;
    },
  };
}
