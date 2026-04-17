import { Dex } from "@pkmn/sim";
import type { Plugin } from "vite";

const VIRTUAL_ID = "virtual:moves";
const RESOLVED_ID = "\0" + VIRTUAL_ID;

export interface MoveInfo {
  type: string;
  category: "Physical" | "Special" | "Status";
  basePower: number;
  accuracy: number | true;
  pp: number;
}

export default function movesPlugin(): Plugin {
  let json: string;

  return {
    name: "moves",

    buildStart() {
      const moves: Record<string, MoveInfo> = {};
      for (const move of Dex.moves.all()) {
        if (!move.exists || move.isNonstandard === "CAP") continue;
        moves[move.name] = {
          type: move.type,
          category: move.category,
          basePower: move.basePower,
          accuracy: move.accuracy,
          pp: move.pp,
        };
      }
      json = JSON.stringify(moves);
    },

    resolveId(id: string): string | null {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },

    load(id: string): string | null {
      return id === RESOLVED_ID ? `export default ${json};` : null;
    },
  };
}
