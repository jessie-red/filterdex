import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import palettesPlugin from "./src/build/palettes.ts";
import movesPlugin from "./src/build/moves.ts";

export default defineConfig({
  plugins: [solid(), palettesPlugin(), movesPlugin()],
  base: "/filterdex/",
  build: { outDir: "docs" },
});
