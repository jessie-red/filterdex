import { ScryDex } from "./dex.ts";
import { getFilters, makeSpeciesFuzzyFilter } from "./filter.ts";
import type { FilterSet } from "./filter.ts";
import type { Pokemon } from "./pokemon.ts";

const SORT_KEYS: Record<string, (p: Pokemon) => number> = {
  hp: (p) => p.baseStats.hp,
  atk: (p) => p.baseStats.atk,
  def: (p) => p.baseStats.def,
  spa: (p) => p.baseStats.spa,
  spd: (p) => p.baseStats.spd,
  spe: (p) => p.baseStats.spe,
  gen: (p) => p.gen,
  weight: (p) => p.weightkg,
  height: (p) => p.heightm,
  num: (p) => p.num,
  bst: (p) =>
    p.baseStats.hp +
    p.baseStats.atk +
    p.baseStats.def +
    p.baseStats.spa +
    p.baseStats.spd +
    p.baseStats.spe,
};

function extractSort(
  words: string[],
): { getter: (p: Pokemon) => number; desc: boolean } | null {
  for (let i = 0; i < words.length; i++) {
    const match = words[i].match(/^sort:([^:]+)(?::(a|d))?$/);
    if (match && SORT_KEYS[match[1]]) {
      words.splice(i, 1);
      return { getter: SORT_KEYS[match[1]], desc: match[2] !== "a" };
    }
  }
  return null;
}

//takes a search string and returns an array of Pokemon that match the search criteria
export type SearchResult = { results: Pokemon[]; desc: string };

export function searchPokemon(query: string): SearchResult {
  query = query.toLowerCase();
  const words: string[] = query.split(/\s+/);
  const sort = extractSort(words);
  const filterSet: FilterSet = getFilters(words);
  let desc = "";
  if (filterSet.filters.length > 0) {
    desc = `Searching for Pokemon where ${filterSet.filters.map((f) => f.desc || "?").join(" and ")}`;
  }
  if (filterSet.filters.length === 0 && query.trim()) {
    filterSet.filters = [makeSpeciesFuzzyFilter(query)];
  }
  const results = ScryDex.filter((p) =>
    filterSet.filters.every((f) => f.filter(p)),
  );
  const fuzzyFilter = filterSet.filters.find((f) => f.desc?.includes("like"));
  if (sort) {
    results.sort((a, b) =>
      sort.desc
        ? sort.getter(b) - sort.getter(a)
        : sort.getter(a) - sort.getter(b),
    );
  } else if (fuzzyFilter) {
    results.sort(
      (a, b) =>
        (fuzzyFilter.filter(b) as number) - (fuzzyFilter.filter(a) as number),
    );
  }
  return { results, desc };
}
