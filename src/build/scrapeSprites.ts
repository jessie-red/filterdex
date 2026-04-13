import { Dex } from "@pkmn/sim";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const SPRITE_DIR = join(
  import.meta.dirname!,
  "..",
  "..",
  "buildData",
  "sprites",
);
const BASE_URL = "https://play.pokemonshowdown.com/sprites/gen5";
const CONCURRENCY = 20;

async function main() {
  await mkdir(SPRITE_DIR, { recursive: true });

  const spriteIds = new Set<string>();
  for (const species of Dex.species.all()) {
    if (species.num <= 0) continue;
    if (species.forme?.includes("Totem")) continue;
    spriteIds.add(species.spriteid);
  }

  const ids = [...spriteIds];
  let done = 0;
  let failed = 0;

  const download = async (id: string) => {
    const dest = join(SPRITE_DIR, `${id}.png`);
    if (existsSync(dest)) {
      done++;
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/${id}.png`);
      if (!res.ok) {
        failed++;
        return;
      }
      await writeFile(dest, Buffer.from(await res.arrayBuffer()));
      done++;
    } catch {
      failed++;
    }
  };

  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    await Promise.all(ids.slice(i, i + CONCURRENCY).map(download));
    process.stdout.write(`\r${done + failed}/${ids.length} sprites`);
  }

  console.log(`\nDone (${failed} failed)`);
}

main();
