import { createSignal, createMemo, For, Show, onMount } from "solid-js";
import { searchPokemon } from "../../core/search.ts";
import type { Pokemon } from "../../core/pokemon.ts";
import PokemonRow from "../components/PokemonRow.tsx";
import { getQueryParam } from "../router.ts";
import { spriteUrl } from "../sprites.ts";

type SortKey =
  | "num"
  | "name"
  | "hp"
  | "atk"
  | "def"
  | "spa"
  | "spd"
  | "spe"
  | "bst";

const NUMERIC_GETTERS: Record<
  Exclude<SortKey, "name">,
  (p: Pokemon) => number
> = {
  num: (p) => p.num,
  hp: (p) => p.baseStats.hp,
  atk: (p) => p.baseStats.atk,
  def: (p) => p.baseStats.def,
  spa: (p) => p.baseStats.spa,
  spd: (p) => p.baseStats.spd,
  spe: (p) => p.baseStats.spe,
  bst: (p) =>
    p.baseStats.hp +
    p.baseStats.atk +
    p.baseStats.def +
    p.baseStats.spa +
    p.baseStats.spd +
    p.baseStats.spe,
};

const STAT_HEADERS: { key: SortKey; label: string }[] = [
  { key: "hp", label: "HP" },
  { key: "atk", label: "Atk" },
  { key: "def", label: "Def" },
  { key: "spa", label: "SpA" },
  { key: "spd", label: "SpD" },
  { key: "spe", label: "Spe" },
  { key: "bst", label: "BST" },
];

export default function SearchPage(props: {
  mascot: Pokemon;
  onReroll(): void;
  onSelectMascot(p: Pokemon): void;
}) {
  const initialQuery = getQueryParam("q") || "";
  const [query, setQuery] = createSignal(initialQuery);
  const [sortKey, setSortKey] = createSignal<SortKey | null>(null);
  const [sortDesc, setSortDesc] = createSignal(false);

  onMount(() => {
    const q = getQueryParam("q");
    if (q) setQuery(q);
  });

  function handleHeaderClick(key: SortKey) {
    if (sortKey() === key) {
      setSortDesc(!sortDesc());
    } else {
      setSortKey(key);
      setSortDesc(key !== "num" && key !== "name");
    }
  }

  const search = createMemo(() => {
    const q = query().trim();
    return searchPokemon(q);
  });

  const sorted = createMemo(() => {
    const items = [...search().results];
    const key = sortKey();
    if (key) {
      const desc = sortDesc();
      if (key === "name") {
        items.sort((a, b) =>
          desc ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name),
        );
      } else {
        const get = NUMERIC_GETTERS[key];
        items.sort((a, b) => (desc ? get(b) - get(a) : get(a) - get(b)));
      }
    }
    return items.slice(0, 300);
  });

  function arrow(key: SortKey) {
    if (sortKey() !== key) return "\u{25C6}";
    return sortDesc() ? "\u{25BC}" : "\u{25B2}";
  }

  return (
    <>
      <div class="search-row">
        <img
          class="mascot-sprite"
          src={spriteUrl(props.mascot.spriteid)}
          alt={props.mascot.name}
          onClick={props.onReroll}
        />
        <input
          class="search-box"
          type="text"
          placeholder="Search Pokemon..."
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
          autofocus
        />
        <a class="advanced-link" href="#/advanced">
          Advanced Search
        </a>
      </div>
      <Show when={search().desc}>
        <div class="search-desc">{search().desc}</div>
      </Show>
      <div class="table-header pokemon-row">
        <span
          class={`header-cell dex-num ${sortKey() === "num" ? "active" : ""}`}
          onClick={() => handleHeaderClick("num")}
        >
          # {arrow("num")}
        </span>
        <div class="sprite" />
        <span
          class={`header-cell name-col ${sortKey() === "name" ? "active" : ""}`}
          onClick={() => handleHeaderClick("name")}
        >
          Pokemon {arrow("name")}
        </span>
        <span class="types" />
        <span class="abilities" />
        <span class="hidden-ability" />
        <div class="stats">
          {STAT_HEADERS.map((col) => (
            <span
              class={`header-cell stat-value ${col.key === "bst" ? "bst-value" : ""} ${sortKey() === col.key ? "active" : ""}`}
              onClick={() => handleHeaderClick(col.key)}
            >
              {col.label} {arrow(col.key)}
            </span>
          ))}
        </div>
      </div>
      <div class="results">
        <For each={sorted()}>
          {(pokemon) => (
            <PokemonRow pokemon={pokemon} onSelect={props.onSelectMascot} />
          )}
        </For>
      </div>
    </>
  );
}
