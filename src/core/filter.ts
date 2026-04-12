import {
  ScryDex,
  allSpecies,
  allFormes,
  allAbilities,
  allMoves,
} from "./dex.ts";
import { matchWord, normalize, levenshtein, MIN_SCORE } from "./match.ts";
import type { WordMatch } from "./match.ts";
import {
  types,
  tiers,
  stages,
  eggGroups,
  regions,
  tags,
  colors,
} from "./pokemon.ts";
import type { Pokemon } from "./pokemon.ts";

export type Filter = {
  filter: (p: Pokemon) => boolean | string | number;
  desc?: string;
};
export type FuzzyFilter = (p: Pokemon) => number;
export type FilterSet = {
  nameStr?: string;
  filters: Filter[];
  descStr: string;
};
type getFilterFunction = (s: string) => FilterMatch | null;
type FilterMatch = {
  filter: Filter;
  match: number;
};

const formats = ["VGC", "Champions"];
const formatGetter: Record<string, (p: Pokemon) => boolean> = {
  vgc: (p) => p.vgc,
  champions: (p) => p.champions,
};

const FILTER_FUNCTIONS: getFilterFunction[] = [
  getSpeciesFilter,
  getTypeFilter,
  getAbilityFilter,
  getMoveFilter,
  getTierFiler,
  getRegionFilter,
  getFormeFilter,
  getStageFilter,
  getEggGroupFilter,
  getTagFilter,
  getColorFilter,
  getLegalFilter,
  getHpFilter,
  getAtkFilter,
  getDefFilter,
  getSpaFilter,
  getSpdFilter,
  getSpeFilter,
  getGenFilter,
  getWeightFilter,
  getHeightFilter,
  getNumFilter,
  getBstFilter,
];

export function getFilters(words: string[]): FilterSet {
  const filtersList = parseFilters(words);
  const filters = combineFilters(filtersList);
  return filters;
}

const OR_FILTER: Filter = {
  filter: () => "OR",
  desc: "OR",
};

export function parseFilters(words: string[]): Filter[] {
  if (words.length === 0) return [];
  if (words[0] === "or") {
    words.splice(0, 1);
    return [OR_FILTER, ...parseFilters(words)];
  }
  let bestMatch: FilterMatch | null = null;
  let bestSublistLen = 0;
  for (let i = 0; i < words.length; i++) {
    const sublist: string[] = words.slice(0, words.length - i);
    const match = tryGetFilter(sublist);
    if (match && (!bestMatch || match.match > bestMatch.match)) {
      bestMatch = match;
      bestSublistLen = sublist.length;
    }
    if (bestMatch?.match === 100) break;
  }
  if (words.length == 1 && !bestMatch) {
    return [makeSpeciesFuzzyFilter(words[0])];
  }
  if (bestMatch) {
    words.splice(0, bestSublistLen);
    return [bestMatch.filter, ...parseFilters(words)];
  }
  return [];
}

export function combineFilters(filters: Filter[]): FilterSet {
  const result: Filter[] = [];
  for (let i = 0; i < filters.length; i++) {
    if (filters[i] === OR_FILTER) {
      const prev = result.pop();
      const next = filters[++i];
      if (prev && next) {
        result.push({
          filter: (p) => prev.filter(p) || next.filter(p),
          desc: `(${prev.desc || "?"} OR ${next.desc || "?"})`,
        });
      } else if (prev) {
        result.push(prev);
      } else if (next) {
        result.push(next);
      }
    } else {
      result.push(filters[i]);
    }
  }
  const set: FilterSet = {
    filters: result,
    descStr: "NA",
    nameStr: "NA",
  };
  return set;
}

export function makeSpeciesFuzzyFilter(input: string): Filter {
  return {
    filter: (p) => {
      if (input === p.id) return 100;
      if (p.id.startsWith(input)) return 99;
      if (p.id.includes(input)) return 98;
      const dist = levenshtein(input, p.id);
      const maxLen = Math.max(input.length, p.id.length);
      const score = Math.max(0, 100 - Math.round((dist / maxLen) * 100));
      return score >= MIN_SCORE ? score : 0;
    },
    desc: `the name is like ${input}`,
  };
}

function tryGetFilter(words: string[]): FilterMatch | null {
  let best: FilterMatch | null = null;
  for (const filterFunction of FILTER_FUNCTIONS) {
    const match: FilterMatch | null = filterFunction(
      words.join("").replaceAll(" ", "").toLowerCase(),
    );
    if (match) {
      if (match.match === 100) {
        //console.log(`Perfect match for "${words.join(' ')}"`);
        return match;
      }
      if (!best || match.match > best.match) best = match;
    }
  }
  if (best)
    console.log(`Best match for "${words.join(" ")}" is ${best.match}%`);
  return best;
}

function stripPrefix(
  word: string,
  prefixes: string[],
): { value: string; prefixed: boolean } {
  for (const prefix of prefixes) {
    if (word.startsWith(prefix + ":")) {
      return { value: word.slice(prefix.length + 1), prefixed: true };
    }
  }
  return { value: word, prefixed: false };
}

function getSpeciesFilter(word: string): FilterMatch | null {
  const { value, prefixed } = stripPrefix(word, [
    "name",
    "species",
    "pokemon",
    "s",
  ]);
  const match: WordMatch | null = matchWord(value, allSpecies);
  if (!match) return null;

  if (prefixed || match.match === 100) {
    return {
      filter: {
        filter: (p) => p.id.startsWith(match.word),
        desc: `the species is ${match.display}`,
      },
      match: 100,
    };
  }

  // Fuzzy: match all pokemon whose names are similar to the input
  const input = normalize(value);
  return {
    filter: makeSpeciesFuzzyFilter(input),
    match: match.match,
  };
}

function getTypeFilter(word: string): FilterMatch | null {
  const { value, prefixed } = stripPrefix(word, ["type", "t"]);
  const match: WordMatch | null = matchWord(value, [...types]);
  if (!match || (!prefixed && match.match !== 100)) return null;
  return {
    filter: {
      filter: (p) => p.types.includes(match.display as Pokemon["types"][0]),
      desc: `the type is ${match.display}`,
    },
    match: 100,
  };
}

function getAbilityFilter(word: string): FilterMatch | null {
  const { value, prefixed } = stripPrefix(word, ["ability", "a"]);
  const match: WordMatch | null = matchWord(value, allAbilities);
  if (!match || (!prefixed && match.match !== 100)) return null;
  return {
    filter: {
      filter: (p) =>
        Object.values(p.abilities).some(
          (a) => a && a.toLowerCase().replace(/[^a-z0-9]/g, "") === match.word,
        ),
      desc: `the ability is ${match.display}`,
    },
    match: 100,
  };
}

function getMoveFilter(word: string): FilterMatch | null {
  const { value, prefixed } = stripPrefix(word, ["move", "m"]);
  const match: WordMatch | null = matchWord(value, allMoves);
  if (!match || (!prefixed && match.match !== 100)) return null;
  return {
    filter: {
      filter: (p) =>
        p.moves.some(
          (m) => m.toLowerCase().replace(/[^a-z0-9]/g, "") === match.word,
        ),
      desc: `the move ${match.display} is learned`,
    },
    match: 100,
  };
}

function getTierFiler(word: string): FilterMatch | null {
  const { value, prefixed } = stripPrefix(word, ["tier"]);
  const match: WordMatch | null = matchWord(value, [...tiers]);
  if (!match || (!prefixed && match.match !== 100)) return null;
  return {
    filter: {
      filter: (p) =>
        p.tier.toLowerCase().replace(/[^a-z0-9]/g, "") === match.word,
      desc: `the tier is ${match.display}`,
    },
    match: 100,
  };
}

function getFormeFilter(word: string): FilterMatch | null {
  const { value, prefixed } = stripPrefix(word, ["forme", "form"]);
  const match: WordMatch | null = matchWord(value, allFormes);
  if (!match || (!prefixed && match.match !== 100)) return null;
  return {
    filter: {
      filter: (p) =>
        p.forme !== undefined &&
        p.forme.toLowerCase().replace(/[^a-z0-9]/g, "") === match.word,
      desc: `the forme is ${match.display}`,
    },
    match: 100,
  };
}

function getStageFilter(word: string): FilterMatch | null {
  const { value, prefixed } = stripPrefix(word, ["stage"]);
  const match: WordMatch | null = matchWord(value, [...stages]);
  if (!match || (!prefixed && match.match !== 100)) return null;
  return {
    filter: {
      filter: (p) =>
        p.stage.toLowerCase().replace(/[^a-z0-9]/g, "") === match.word,
      desc: `the stage is ${match.display}`,
    },
    match: 100,
  };
}

function getEggGroupFilter(word: string): FilterMatch | null {
  const { value, prefixed } = stripPrefix(word, ["egg", "egggroup", "eg"]);
  const match: WordMatch | null = matchWord(value, [...eggGroups]);
  if (!match || (!prefixed && match.match !== 100)) return null;
  return {
    filter: {
      filter: (p) =>
        p.eggGroups.some(
          (eg) => eg.toLowerCase().replace(/[^a-z0-9]/g, "") === match.word,
        ),
      desc: `the egg group is ${match.display}`,
    },
    match: 100,
  };
}

function getRegionFilter(word: string): FilterMatch | null {
  const { value, prefixed } = stripPrefix(word, ["region", "reg"]);
  const match: WordMatch | null = matchWord(value, [...regions]);
  if (!match || (!prefixed && match.match !== 100)) return null;
  return {
    filter: {
      filter: (p) =>
        p.region.toLowerCase().replace(/[^a-z0-9]/g, "") === match.word,
      desc: `the region is ${match.display}`,
    },
    match: 100,
  };
}

function getTagFilter(word: string): FilterMatch | null {
  const { value, prefixed } = stripPrefix(word, ["tag", "is"]);
  const match: WordMatch | null = matchWord(value, [...tags]);
  if (!match || (!prefixed && match.match !== 100)) return null;
  return {
    filter: {
      filter: (p) =>
        p.tags.some(
          (t) => t.toLowerCase().replace(/[^a-z0-9]/g, "") === match.word,
        ),
      desc: `the tag is ${match.display}`,
    },
    match: 100,
  };
}

function getColorFilter(word: string): FilterMatch | null {
  const { value, prefixed } = stripPrefix(word, ["color", "c"]);
  const match: WordMatch | null = matchWord(value, [...colors]);
  if (!match || (!prefixed && match.match !== 100)) return null;
  return {
    filter: {
      filter: (p) =>
        p.color.toLowerCase().replace(/[^a-z0-9]/g, "") === match.word,
      desc: `the color is ${match.display}`,
    },
    match: 100,
  };
}

function getLegalFilter(word: string): FilterMatch | null {
  const { value, prefixed } = stripPrefix(word, ["legal", "format", "f"]);
  const match: WordMatch | null = matchWord(value, [...formats]);
  if (!match || (!prefixed && match.match !== 100)) return null;
  const getter = formatGetter[match.word];
  if (!getter) return null;
  return {
    filter: {
      filter: (p) => getter(p),
      desc: `the legality includes ${match.display}`,
    },
    match: 100,
  };
}

type Operator = "=" | "!=" | "<=" | ">=" | "<" | ">";
const OPERATORS: Operator[] = ["!=", "<=", ">=", "<", ">", "="];

function parseNumericFilter(
  word: string,
  prefixes: string[],
): { op: Operator; value: number } | null {
  for (const prefix of prefixes) {
    if (!word.startsWith(prefix)) continue;
    const rest = word.slice(prefix.length);
    for (const op of OPERATORS) {
      if (!rest.startsWith(op)) continue;
      const num = Number(rest.slice(op.length));
      if (isNaN(num)) continue;
      return { op, value: num };
    }
  }
  return null;
}

function compareWith(op: Operator, actual: number, value: number): boolean {
  switch (op) {
    case "=":
      return actual === value;
    case "!=":
      return actual !== value;
    case "<=":
      return actual <= value;
    case ">=":
      return actual >= value;
    case "<":
      return actual < value;
    case ">":
      return actual > value;
  }
}

function opDesc(op: Operator): string {
  switch (op) {
    case "=":
      return "is";
    case "!=":
      return "is not";
    case "<":
      return "is below";
    case ">":
      return "is above";
    case "<=":
      return "is at most";
    case ">=":
      return "is at least";
  }
}

function makeNumericFilter(
  word: string,
  prefixes: string[],
  label: string,
  getter: (p: Pokemon) => number,
): FilterMatch | null {
  const parsed = parseNumericFilter(word, prefixes);
  if (!parsed) return null;
  return {
    filter: {
      filter: (p) => compareWith(parsed.op, getter(p), parsed.value),
      desc: `the ${label} ${opDesc(parsed.op)} ${parsed.value}`,
    },
    match: 100,
  };
}

function getHpFilter(word: string): FilterMatch | null {
  return makeNumericFilter(word, ["hp"], "HP", (p) => p.baseStats.hp);
}

function getAtkFilter(word: string): FilterMatch | null {
  return makeNumericFilter(word, ["atk"], "attack", (p) => p.baseStats.atk);
}

function getDefFilter(word: string): FilterMatch | null {
  return makeNumericFilter(word, ["def"], "defense", (p) => p.baseStats.def);
}

function getSpaFilter(word: string): FilterMatch | null {
  return makeNumericFilter(
    word,
    ["spa"],
    "special attack",
    (p) => p.baseStats.spa,
  );
}

function getSpdFilter(word: string): FilterMatch | null {
  return makeNumericFilter(
    word,
    ["spd"],
    "special defense",
    (p) => p.baseStats.spd,
  );
}

function getSpeFilter(word: string): FilterMatch | null {
  return makeNumericFilter(word, ["spe"], "speed", (p) => p.baseStats.spe);
}

function getGenFilter(word: string): FilterMatch | null {
  return makeNumericFilter(word, ["gen", "g"], "generation", (p) => p.gen);
}

function getWeightFilter(word: string): FilterMatch | null {
  return makeNumericFilter(word, ["weight", "w"], "weight", (p) => p.weightkg);
}

function getHeightFilter(word: string): FilterMatch | null {
  return makeNumericFilter(word, ["height", "h"], "height", (p) => p.heightm);
}

function getNumFilter(word: string): FilterMatch | null {
  return makeNumericFilter(
    word,
    ["num", "n", "dex"],
    "dex number",
    (p) => p.num,
  );
}

function getBstFilter(word: string): FilterMatch | null {
  return makeNumericFilter(
    word,
    ["bst"],
    "base stat total",
    (p) =>
      p.baseStats.hp +
      p.baseStats.atk +
      p.baseStats.def +
      p.baseStats.spa +
      p.baseStats.spd +
      p.baseStats.spe,
  );
}
