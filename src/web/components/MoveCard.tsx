import { createSignal, createMemo, For } from "solid-js";
import allMoves from "virtual:moves";
import type { MoveInfo } from "../../build/moves.ts";
import MoveRow from "./MoveRow.tsx";

type MoveSortKey = "name" | "type" | "category" | "power" | "accuracy" | "pp";

const CATEGORY_ORDER: Record<MoveInfo["category"], number> = {
  Physical: 0,
  Special: 1,
  Status: 2,
};

function accuracyNum(acc: number | true): number {
  return acc === true ? 101 : acc;
}

export default function MoveCard(props: {
  moves: string[];
  onSearch(query: string): void;
}) {
  const [sortKey, setSortKey] = createSignal<MoveSortKey | null>(null);
  const [sortDesc, setSortDesc] = createSignal(false);

  function handleHeaderClick(key: MoveSortKey) {
    if (sortKey() === key) {
      setSortDesc(!sortDesc());
    } else {
      setSortKey(key);
      setSortDesc(key === "power" || key === "accuracy" || key === "pp");
    }
  }

  function arrow(key: MoveSortKey): string {
    if (sortKey() !== key) return "\u25C6";
    return sortDesc() ? "\u25BC" : "\u25B2";
  }

  const sorted = createMemo(() => {
    const items = [...props.moves].filter((name) => name in allMoves);
    const key = sortKey();
    if (!key) return items.sort((a, b) => a.localeCompare(b));

    const desc = sortDesc();
    items.sort((a, b) => {
      const ma: MoveInfo = allMoves[a];
      const mb: MoveInfo = allMoves[b];
      let cmp: number;
      switch (key) {
        case "name":
          cmp = a.localeCompare(b);
          break;
        case "type":
          cmp = ma.type.localeCompare(mb.type);
          break;
        case "category":
          cmp = CATEGORY_ORDER[ma.category] - CATEGORY_ORDER[mb.category];
          break;
        case "power":
          cmp = ma.basePower - mb.basePower;
          break;
        case "accuracy":
          cmp = accuracyNum(ma.accuracy) - accuracyNum(mb.accuracy);
          break;
        case "pp":
          cmp = ma.pp - mb.pp;
          break;
      }
      return desc ? -cmp : cmp;
    });
    return items;
  });

  return (
    <div class="move-card">
      <div class="move-card-header move-row">
        <span
          class={`header-cell move-name ${sortKey() === "name" ? "active" : ""}`}
          onClick={() => handleHeaderClick("name")}
        >
          Move {arrow("name")}
        </span>
        <span
          class={`header-cell move-type-col ${sortKey() === "type" ? "active" : ""}`}
          onClick={() => handleHeaderClick("type")}
        >
          Type {arrow("type")}
        </span>
        <span
          class={`header-cell move-category-col ${sortKey() === "category" ? "active" : ""}`}
          onClick={() => handleHeaderClick("category")}
        >
          Cat. {arrow("category")}
        </span>
        <span
          class={`header-cell move-stat ${sortKey() === "power" ? "active" : ""}`}
          onClick={() => handleHeaderClick("power")}
        >
          Power {arrow("power")}
        </span>
        <span
          class={`header-cell move-stat ${sortKey() === "accuracy" ? "active" : ""}`}
          onClick={() => handleHeaderClick("accuracy")}
        >
          Acc {arrow("accuracy")}
        </span>
        <span
          class={`header-cell move-stat ${sortKey() === "pp" ? "active" : ""}`}
          onClick={() => handleHeaderClick("pp")}
        >
          PP {arrow("pp")}
        </span>
        <span class="header-cell move-desc">Description</span>
      </div>
      <For each={sorted()}>
        {(name) => (
          <MoveRow
            name={name}
            info={allMoves[name]}
            onSearch={props.onSearch}
          />
        )}
      </For>
    </div>
  );
}
