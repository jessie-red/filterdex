declare module "virtual:moves" {
  import type { MoveInfo } from "./moves.ts";
  const moves: Record<string, MoveInfo>;
  export default moves;
}
