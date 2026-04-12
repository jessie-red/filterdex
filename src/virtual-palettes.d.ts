declare module "virtual:palettes" {
  import type { HexPalette } from "./core/palette.ts";
  const palettes: Record<string, HexPalette>;
  export default palettes;
}
