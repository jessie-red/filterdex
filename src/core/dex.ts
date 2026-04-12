import { Dex } from "@pkmn/sim";
import type { Species } from "@pkmn/sim";
import { types, eggGroups, tags, colors } from "./pokemon.ts";
import type {
  Pokemon,
  Type,
  Stage,
  Region,
  EggGroup,
  Tag,
  Color,
} from "./pokemon.ts";

export const VGC_FORMAT = "[Gen 9] VGC 2026 Reg M-A";
const VGC_RULES = determineVGCRules(VGC_FORMAT);
const CURRENT_GEN = 9;
const BANNED_TAGS = new Set(["Mythical", "Restricted Legendary"]);
const CHAMPIONS_URL =
  "https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/mods/champions";

// Mega ability overrides from smogon/pokemon-showdown#11910 (merged 2026-04-11).
// Remove once @pkmn/sim publishes a version newer than 0.10.7.
// prettier-ignore
const MEGA_OVERRIDES: Record<string, { abilities: { 0: string }; baseStats?: Pokemon['baseStats'] }> = {
    clefablemega:       { abilities: { 0: "Magic Bounce" } },
    victreebelmega:     { abilities: { 0: "Innards Out" } },
    starmiemega:        { abilities: { 0: "Huge Power" }, baseStats: { hp: 60, atk: 100, def: 105, spa: 130, spd: 105, spe: 120 } },
    skarmorymega:       { abilities: { 0: "Stalwart" } },
    excadrillmega:      { abilities: { 0: "Piercing Drill" } },
    chandeluremega:     { abilities: { 0: "Infiltrator" } },
    golurkmega:         { abilities: { 0: "Unseen Fist" } },
    floettemega:        { abilities: { 0: "Fairy Aura" } },
    meowsticmmega:      { abilities: { 0: "Trace" } },
    meowsticfmega:      { abilities: { 0: "Trace" } },
    hawluchamega:       { abilities: { 0: "No Guard" } },
    crabominablemega:   { abilities: { 0: "Iron Fist" } },
    drampamega:         { abilities: { 0: "Berserk" } },
    scovillainmega:     { abilities: { 0: "Spicy Spray" } },
    glimmoramega:       { abilities: { 0: "Adaptability" } },
};

type VGCRules = {
  latestGen: number;
  restricted: boolean;
};

function determineVGCRules(format: string): VGCRules {
  const ruleset = Dex.formats.get(VGC_FORMAT).ruleset;
  const minsourcegen =
    ruleset.find((rule) => rule.startsWith("Min Source Gen"))?.split("=")[1] ||
    "1";
  const rules: VGCRules = {
    latestGen: minsourcegen ? parseInt(minsourcegen) : 1,
    restricted: !!Dex.formats.get(VGC_FORMAT)?.restricted,
  };
  return rules;
}

const restrictedAllowed = !!Dex.formats.get(VGC_FORMAT)?.restricted;

function parseType(s: string): Type {
  if ((types as readonly string[]).includes(s)) return s as Type;
  throw new Error(`Invalid type: ${s}`);
}

function parseEggGroup(s: string): EggGroup {
  if ((eggGroups as readonly string[]).includes(s)) return s as EggGroup;
  throw new Error(`Invalid egg group: ${s}`);
}

function parseTag(s: string): Tag {
  if ((tags as readonly string[]).includes(s)) return s as Tag;
  throw new Error(`Invalid tag: ${s}`);
}

function parseColor(s: string): Color {
  if ((colors as readonly string[]).includes(s)) return s as Color;
  throw new Error(`Invalid color: ${s}`);
}

type DexData = {
  dex: Pokemon[];
  allSpecies: string[];
  allFormes: string[];
  allAbilities: string[];
  allMoves: string[];
};

type ChampionsData = {
  legalPokemon: Set<string>;
  learnsets: Map<string, string[]>;
};

async function fetchChampionsData(): Promise<ChampionsData | null> {
  try {
    const [formatsText, learnsetsText] = await Promise.all([
      fetch(`${CHAMPIONS_URL}/formats-data.ts`).then((r) => r.text()),
      fetch(`${CHAMPIONS_URL}/learnsets.ts`).then((r) => r.text()),
    ]);

    const legalPokemon = new Set<string>();
    for (const match of formatsText.matchAll(
      /\t(\w+):\s*\{([\s\S]*?)\n\t\}/g,
    )) {
      if (/tier:\s*"(?!Illegal)\w+"/.test(match[2])) {
        legalPokemon.add(match[1]);
      }
    }

    const learnsets = new Map<string, string[]>();
    for (const [, pokemonId, content] of learnsetsText.matchAll(
      /\t(\w+):\s*\{\s*learnset:\s*\{([\s\S]*?)\}\s*,?\s*\}/g,
    )) {
      const moves: string[] = [];
      for (const [, moveId] of content.matchAll(/(\w+):\s*\[/g)) {
        moves.push(moveId);
      }
      if (moves.length) learnsets.set(pokemonId, moves);
    }

    return { legalPokemon, learnsets };
  } catch (e) {
    console.error("Failed to fetch Champions format data:", e);
    return null;
  }
}

async function buildDex(): Promise<DexData> {
  const champions = await fetchChampionsData();
  const dex: Pokemon[] = [];
  const speciesSet = new Set<string>();
  const formeSet = new Set<string>();
  const abilitySet = new Set<string>();
  const moveSet = new Set<string>();
  for (const species of Dex.species.all()) {
    if (species.num <= 0) continue; // skip non-pokemon species
    if (species.forme?.includes("Totem")) continue;
    speciesSet.add(species.name);
    if (species.forme) formeSet.add(species.forme);
    const megaOverride = MEGA_OVERRIDES[species.id];
    for (const a of Object.values(
      megaOverride?.abilities ?? species.abilities,
    )) {
      if (a) abilitySet.add(a);
    }
    const moves = getMoves(species, champions);
    for (const m of moves) {
      moveSet.add(m);
    }
    const pokemon: Pokemon = {
      num: species.num,
      id: species.id,
      name: species.name,
      spriteid: species.spriteid,
      types: [
        parseType(species.types[0]),
        species.types[1] ? parseType(species.types[1]) : undefined,
      ],
      moves,
      abilities: megaOverride?.abilities ?? species.abilities,
      baseStats: megaOverride?.baseStats ?? species.baseStats,
      forme: species.forme,
      gen: species.gen,
      latestGeneration: getLatestGen(species, CURRENT_GEN),
      region: getRegion(species),
      eggGroups: species.eggGroups.map(parseEggGroup),
      weightkg: species.weightkg,
      heightm: species.heightm,
      tags: species.tags.map(parseTag),
      stage: getStage(species),
      color: parseColor(species.color),
      restricted: getRestricted(species),
      tier: species.tier,
      //vgc: getVGC(species),
      vgc: champions?.legalPokemon.has(species.id) ?? false,
      champions: champions?.legalPokemon.has(species.id) ?? false,
    };
    dex.push(pokemon);
  }
  return {
    dex,
    allSpecies: [...speciesSet].sort(),
    allFormes: [...formeSet].sort(),
    allAbilities: [...abilitySet].sort(),
    allMoves: [...moveSet].sort(),
  };
}

function getMoves(species: Species, champions: ChampionsData | null): string[] {
  const baseId = species.baseSpecies
    ? Dex.species.get(species.baseSpecies).id
    : species.id;
  const learnset =
    champions?.learnsets.get(species.id) ?? champions?.learnsets.get(baseId);
  if (learnset) {
    return learnset
      .map((m) => Dex.moves.get(m))
      .filter((m) => m.exists)
      .map((m) => m.name);
  }
  return [...Dex.species.getMovePool(species.id)].map(
    (m) => Dex.moves.get(m).name,
  );
}

function getLatestGen(species: Species, gen: number): number {
  if (gen == 1) {
    return gen;
  } else if (species.isNonstandard != "Past") {
    return gen;
  } else {
    return getLatestGen(Dex.forGen(gen - 1).species.get(species.id), gen - 1);
  }
}

const genToRegion: Record<number, Region> = {
  1: "Kanto",
  2: "Johto",
  3: "Hoenn",
  4: "Sinnoh",
  5: "Unova",
  6: "Kalos",
  7: "Alola",
  8: "Galar",
  9: "Paldea",
};

const hisuiOrigins = new Set([
  899, // Wyrdeer
  900, // Kleavor
  901, // Ursaluna
  902, // Basculegion
  903, // Sneasler
  904, // Overqwil
  905, // Enamorus
]);

function getRegion(species: Species): Region {
  if (species.forme === "Alola") return "Alola";
  if (species.forme === "Galar") return "Galar";
  if (species.forme === "Hisui") return "Hisui";
  if (species.forme === "Paldea") return "Paldea";
  if (hisuiOrigins.has(species.num)) return "Hisui";
  const region = genToRegion[species.gen];
  if (!region) throw new Error(`Unknown region for gen ${species.gen}`);
  return region;
}

function getStage(species: Species): Stage {
  if (species.prevo) {
    const prevo = Dex.species.get(species.prevo);
    if (prevo.prevo) {
      return "Stage 2";
    }
    return "Stage 1";
  }
  if (species.isMega) {
    return "Mega";
  }
  if (species.isPrimal) {
    return "Primal";
  }
  if (species.forme == "Gmax") {
    return "Gmax";
  }
  return "Basic";
}

function getRestricted(species: Species): boolean {
  return species.tags.includes("Restricted Legendary");
}

function getVGC(species: Species): boolean {
  if (!VGC_RULES.restricted) {
    if (species.tags.some((tag) => BANNED_TAGS.has(tag))) {
      return false;
    }
  }
  const latestGen = getLatestGen(species, CURRENT_GEN);
  return latestGen == VGC_RULES.latestGen;
}
const {
  dex: ScryDex,
  allSpecies,
  allFormes,
  allAbilities,
  allMoves,
} = await buildDex();
export { ScryDex, allSpecies, allFormes, allAbilities, allMoves };
