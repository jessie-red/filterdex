import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import palettesPlugin from "./scripts/vite-plugin-palettes.ts";

export default defineConfig({
  plugins: [solid(), palettesPlugin()],
  base: "/filterdex/",
  build: { outDir: "docs" },
});
