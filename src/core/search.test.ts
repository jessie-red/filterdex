// @vitest-environment node
import { describe, it, expect } from "vitest";
import { searchPokemon } from "./search.ts";
import { ScryDex } from "./dex.ts";
import type { Pokemon } from "./pokemon.ts";

const ids = (results: Pokemon[]) => new Set(results.map((p) => p.id));
const bst = (p: Pokemon) =>
  p.baseStats.hp +
  p.baseStats.atk +
  p.baseStats.def +
  p.baseStats.spa +
  p.baseStats.spd +
  p.baseStats.spe;

describe("searchPokemon — empty query", () => {
  it("returns the full dex for the empty string", () => {
    const { results, desc } = searchPokemon("");
    expect(results.length).toBe(ScryDex.length);
    expect(desc).toBe("Searching for all Pokemon");
  });

  it("returns the full dex for whitespace", () => {
    const { results } = searchPokemon("   ");
    expect(results.length).toBe(ScryDex.length);
  });
});

describe("searchPokemon — species", () => {
  it("fuzzy-matches a bare species name", () => {
    const { results } = searchPokemon("bulbasaur");
    expect(ids(results).has("bulbasaur")).toBe(true);
    expect(results[0].id).toBe("bulbasaur");
  });

  it("tolerates a typo in the species name", () => {
    const { results } = searchPokemon("bulbasur");
    expect(ids(results).has("bulbasaur")).toBe(true);
  });

  it("name: prefix treats the value as a startsWith match", () => {
    const { results } = searchPokemon("name:pikachu");
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) expect(p.id.startsWith("pikachu")).toBe(true);
  });

  it("species: prefix works the same as name:", () => {
    const a = ids(searchPokemon("species:charizard").results);
    const b = ids(searchPokemon("name:charizard").results);
    expect(a).toEqual(b);
  });
});

describe("searchPokemon — keyword filters", () => {
  it("bare type keyword filters by that type", () => {
    const { results } = searchPokemon("fire");
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) expect(p.types).toContain("Fire");
    expect(ids(results).has("charizard")).toBe(true);
  });

  it("t: prefix filters by type", () => {
    const { results } = searchPokemon("t:water");
    for (const p of results) expect(p.types).toContain("Water");
  });

  it("type: prefix filters by type", () => {
    const { results } = searchPokemon("type:grass");
    for (const p of results) expect(p.types).toContain("Grass");
  });

  it("ability: prefix filters by ability", () => {
    const { results } = searchPokemon("ability:levitate");
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) {
      const abilities = Object.values(p.abilities).filter(
        (a): a is string => typeof a === "string",
      );
      expect(abilities).toContain("Levitate");
    }
  });

  it("move: prefix filters to learners of a move", () => {
    const { results } = searchPokemon("move:spore");
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) {
      const normalized = p.moves.map((m) =>
        m.toLowerCase().replace(/[^a-z0-9]/g, ""),
      );
      expect(normalized).toContain("spore");
    }
    expect(ids(results).has("amoonguss")).toBe(true);
  });

  it("tier: prefix filters by tier", () => {
    const { results } = searchPokemon("tier:ou");
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) expect(p.tier).toBe("OU");
  });

  it("region: prefix filters by region", () => {
    const { results } = searchPokemon("region:kanto");
    for (const p of results) expect(p.region).toBe("Kanto");
    expect(ids(results).has("bulbasaur")).toBe(true);
  });

  it("stage: prefix filters by stage", () => {
    const { results } = searchPokemon("stage:mega");
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) expect(p.stage).toBe("Mega");
  });

  it("egg: prefix filters by egg group", () => {
    const { results } = searchPokemon("egg:dragon");
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) expect(p.eggGroups).toContain("Dragon");
  });

  it("is: prefix filters by tag", () => {
    const { results } = searchPokemon("is:mythical");
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) expect(p.tags).toContain("Mythical");
    expect(ids(results).has("mew")).toBe(true);
  });

  it("color: prefix filters by color", () => {
    const { results } = searchPokemon("color:red");
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) expect(p.color).toBe("Red");
  });

  it("legal:vgc keeps only VGC-legal Pokemon", () => {
    const { results } = searchPokemon("legal:vgc");
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) expect(p.vgc).toBe(true);
  });

  it("legal:champions keeps only Champions-legal Pokemon", () => {
    const { results } = searchPokemon("legal:champions");
    for (const p of results) expect(p.champions).toBe(true);
  });

  it("tier:vgc accepts a format value via the tier prefix", () => {
    const { results } = searchPokemon("tier:vgc");
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) expect(p.vgc).toBe(true);
  });

  it("legal:ou accepts a Smogon tier via the legal prefix", () => {
    const { results } = searchPokemon("legal:ou");
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) expect(p.tier).toBe("OU");
  });

  it("format:ou accepts a Smogon tier via the format prefix", () => {
    const a = ids(searchPokemon("format:ou").results);
    const b = ids(searchPokemon("tier:ou").results);
    expect(a).toEqual(b);
  });
});

describe("searchPokemon — numeric filters", () => {
  it("hp>200 returns only very bulky Pokemon", () => {
    const { results } = searchPokemon("hp>200");
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) expect(p.baseStats.hp).toBeGreaterThan(200);
    expect(ids(results).has("blissey")).toBe(true);
  });

  it("bst>=600 returns only pseudo-legendaries and up", () => {
    const { results } = searchPokemon("bst>=600");
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) expect(bst(p)).toBeGreaterThanOrEqual(600);
  });

  it("gen=1 restricts to first-generation Pokemon", () => {
    const { results } = searchPokemon("gen=1");
    for (const p of results) expect(p.gen).toBe(1);
  });

  it("gen<=3 includes gen 1, 2, 3", () => {
    const { results } = searchPokemon("gen<=3");
    for (const p of results) expect(p.gen).toBeLessThanOrEqual(3);
  });

  it("gen!=1 excludes first-generation Pokemon", () => {
    const { results } = searchPokemon("gen!=1");
    for (const p of results) expect(p.gen).not.toBe(1);
  });

  it("spa>135 filters by special attack", () => {
    const { results } = searchPokemon("spa>135");
    for (const p of results) expect(p.baseStats.spa).toBeGreaterThan(135);
  });

  it("num<=151 caps by dex number", () => {
    const { results } = searchPokemon("num<=151");
    for (const p of results) expect(p.num).toBeLessThanOrEqual(151);
  });

  it("weight<1 keeps only very light Pokemon", () => {
    const { results } = searchPokemon("weight<1");
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) expect(p.weightkg).toBeLessThan(1);
  });

  it("height>3 keeps only very tall Pokemon", () => {
    const { results } = searchPokemon("height>3");
    for (const p of results) expect(p.heightm).toBeGreaterThan(3);
  });

  it("atk and def filters combine on AND", () => {
    const { results } = searchPokemon("atk>=130 def>=130");
    for (const p of results) {
      expect(p.baseStats.atk).toBeGreaterThanOrEqual(130);
      expect(p.baseStats.def).toBeGreaterThanOrEqual(130);
    }
  });
});

describe("searchPokemon — sort", () => {
  it("sort:bst defaults to descending", () => {
    const { results } = searchPokemon("sort:bst");
    for (let i = 1; i < results.length; i++) {
      expect(bst(results[i])).toBeLessThanOrEqual(bst(results[i - 1]));
    }
  });

  it("sort:spe:a sorts by speed ascending", () => {
    const { results } = searchPokemon("sort:spe:a");
    for (let i = 1; i < results.length; i++) {
      expect(results[i].baseStats.spe).toBeGreaterThanOrEqual(
        results[i - 1].baseStats.spe,
      );
    }
  });

  it("sort:num:d sorts by dex number descending", () => {
    const { results } = searchPokemon("sort:num:d");
    for (let i = 1; i < results.length; i++) {
      expect(results[i].num).toBeLessThanOrEqual(results[i - 1].num);
    }
  });

  it("sort applies after filters", () => {
    const { results } = searchPokemon("type:fire sort:bst:a");
    for (const p of results) expect(p.types).toContain("Fire");
    for (let i = 1; i < results.length; i++) {
      expect(bst(results[i])).toBeGreaterThanOrEqual(bst(results[i - 1]));
    }
  });
});

describe("searchPokemon — OR combinator", () => {
  it("fire or water yields the union of the two types", () => {
    const { results } = searchPokemon("type:fire or type:water");
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) {
      const hit = p.types.includes("Fire") || p.types.includes("Water");
      expect(hit).toBe(true);
    }
    const union = ids(results);
    expect(union.has("charizard")).toBe(true);
    expect(union.has("blastoise")).toBe(true);
  });

  it("OR groups pairwise and combines with later filters via AND", () => {
    const { results } = searchPokemon("type:fire or type:water gen=1");
    for (const p of results) {
      expect(p.gen).toBe(1);
      expect(p.types.includes("Fire") || p.types.includes("Water")).toBe(true);
    }
  });
});

describe("searchPokemon — negation", () => {
  it("!type:fire excludes fire types", () => {
    const { results } = searchPokemon("!type:fire");
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) expect(p.types).not.toContain("Fire");
    expect(ids(results).has("charizard")).toBe(false);
  });

  it("!fire (bare keyword) excludes fire types", () => {
    const { results } = searchPokemon("!fire");
    for (const p of results) expect(p.types).not.toContain("Fire");
  });

  it("!is:mythical excludes mythical Pokemon", () => {
    const { results } = searchPokemon("!is:mythical");
    for (const p of results) expect(p.tags).not.toContain("Mythical");
    expect(ids(results).has("mew")).toBe(false);
  });

  it("combines negation with other filters on AND", () => {
    const { results } = searchPokemon("gen=1 !type:fire");
    for (const p of results) {
      expect(p.gen).toBe(1);
      expect(p.types).not.toContain("Fire");
    }
    expect(ids(results).has("charizard")).toBe(false);
    expect(ids(results).has("bulbasaur")).toBe(true);
  });

  it("negated filter shows up in the description", () => {
    const { desc } = searchPokemon("!type:fire");
    expect(desc).toContain("NOT");
    expect(desc).toContain("Fire");
  });
});

describe("searchPokemon — combined filters", () => {
  it("type:fire gen=1 returns only gen-1 fire types", () => {
    const { results } = searchPokemon("type:fire gen=1");
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) {
      expect(p.types).toContain("Fire");
      expect(p.gen).toBe(1);
    }
    expect(ids(results).has("charizard")).toBe(true);
  });

  it("bst>=600 is:mythical narrows to mythical Pokemon with high BST", () => {
    const { results } = searchPokemon("bst>=600 is:mythical");
    for (const p of results) {
      expect(bst(p)).toBeGreaterThanOrEqual(600);
      expect(p.tags).toContain("Mythical");
    }
  });

  it("builds a descriptive summary for filtered queries", () => {
    const { desc } = searchPokemon("type:fire gen=1");
    expect(desc.startsWith("Searching for Pokemon where")).toBe(true);
    expect(desc).toContain("Fire");
    expect(desc).toContain("generation is 1");
  });
});
