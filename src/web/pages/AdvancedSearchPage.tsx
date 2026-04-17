import { createSignal, For } from "solid-js";
import {
  types,
  tiers,
  stages,
  regions,
  eggGroups,
  tags,
  colors,
} from "../../core/pokemon.ts";
import type { Type } from "../../core/pokemon.ts";
import { VGC_FORMAT } from "../../core/dex.ts";

import "../AdvancedSearch.css";

const TYPE_COLORS: Record<Type, string> = {
  Normal: "#A8A77A",
  Fire: "#EE8130",
  Water: "#6390F0",
  Electric: "#F7D02C",
  Grass: "#7AC74C",
  Ice: "#96D9D6",
  Fighting: "#C22E28",
  Poison: "#A33EA1",
  Ground: "#E2BF65",
  Flying: "#A98FF3",
  Psychic: "#F95587",
  Bug: "#A6B91A",
  Rock: "#B6A136",
  Ghost: "#735797",
  Dragon: "#6F35FC",
  Dark: "#705746",
  Steel: "#B7B7CE",
  Fairy: "#D685AD",
};

const STAT_NAMES = ["hp", "atk", "def", "spa", "spd", "spe", "bst"] as const;
const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  atk: "Attack",
  def: "Defense",
  spa: "Sp. Atk",
  spd: "Sp. Def",
  spe: "Speed",
  bst: "BST",
};
const OPERATORS = ["=", "!=", "<", ">", "<=", ">="] as const;

type StatRow = { stat: string; op: string; value: string };

const FORMAT_OPTIONS = [
  { value: "VGC", label: VGC_FORMAT },
  { value: "Champions", label: "Champions" },
];
const FORMAT_VALUES = new Set(FORMAT_OPTIONS.map((f) => normalize(f.value)));
const DISPLAY_TIERS = tiers.filter((t) => !t.startsWith("("));

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function AdvancedSearchPage(props: {
  mascotName: string;
  onSearch(query: string): void;
}) {
  const [name, setName] = createSignal("");
  const [selectedTypes, setSelectedTypes] = createSignal<Set<string>>(
    new Set(),
  );
  const [statRows, setStatRows] = createSignal<StatRow[]>([
    { stat: "hp", op: ">=", value: "" },
  ]);
  const [genOp, setGenOp] = createSignal("=");
  const [genValue, setGenValue] = createSignal("");
  const [weightOp, setWeightOp] = createSignal(">=");
  const [weightValue, setWeightValue] = createSignal("");
  const [heightOp, setHeightOp] = createSignal(">=");
  const [heightValue, setHeightValue] = createSignal("");
  const [format, setFormat] = createSignal("");
  const [stage, setStage] = createSignal("");
  const [region, setRegion] = createSignal("");
  const [eggGroup, setEggGroup] = createSignal("");
  const [selectedTags, setSelectedTags] = createSignal<Set<string>>(new Set());
  const [color, setColor] = createSignal("");
  const [ability, setAbility] = createSignal("");
  const [move, setMove] = createSignal("");

  function toggleType(t: string) {
    const next = new Set(selectedTypes());
    if (next.has(t)) next.delete(t);
    else next.add(t);
    setSelectedTypes(next);
  }

  function toggleTag(t: string) {
    const next = new Set(selectedTags());
    if (next.has(t)) next.delete(t);
    else next.add(t);
    setSelectedTags(next);
  }

  function addStatRow() {
    setStatRows([...statRows(), { stat: "hp", op: ">=", value: "" }]);
  }

  function removeStatRow(index: number) {
    setStatRows(statRows().filter((_, i) => i !== index));
  }

  function updateStatRow(index: number, field: keyof StatRow, value: string) {
    setStatRows(
      statRows().map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      ),
    );
  }

  function buildQuery(): string {
    const parts: string[] = [];

    const n = name().trim();
    if (n) parts.push(n);

    const typeEntries = [...selectedTypes()];
    if (typeEntries.length === 1) {
      parts.push(`type:${typeEntries[0].toLowerCase()}`);
    } else if (typeEntries.length > 1) {
      parts.push(
        typeEntries.map((t) => `type:${t.toLowerCase()}`).join(" or "),
      );
    }

    for (const row of statRows()) {
      if (row.value) {
        parts.push(`${row.stat}${row.op}${row.value}`);
      }
    }

    if (genValue()) parts.push(`gen${genOp()}${genValue()}`);
    if (weightValue()) parts.push(`weight${weightOp()}${weightValue()}`);
    if (heightValue()) parts.push(`height${heightOp()}${heightValue()}`);

    const f = format();
    if (f) {
      if (FORMAT_VALUES.has(normalize(f))) {
        parts.push(`legal:${normalize(f)}`);
      } else {
        parts.push(`tier:${normalize(f)}`);
      }
    }

    if (stage()) parts.push(`stage:${normalize(stage())}`);
    if (region()) parts.push(`reg:${normalize(region())}`);
    if (eggGroup()) parts.push(`egg:${normalize(eggGroup())}`);

    const tagEntries = [...selectedTags()];
    if (tagEntries.length === 1) {
      parts.push(`is:${normalize(tagEntries[0])}`);
    } else if (tagEntries.length > 1) {
      parts.push(tagEntries.map((t) => `is:${normalize(t)}`).join(" or "));
    }

    if (color()) parts.push(`color:${normalize(color())}`);
    if (ability().trim()) parts.push(`ability:${normalize(ability().trim())}`);
    if (move().trim()) parts.push(`move:${normalize(move().trim())}`);

    return parts.join(" ");
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    const query = buildQuery();
    props.onSearch(query);
    window.scrollTo(0, 0);
  }

  function handleReset() {
    setName("");
    setSelectedTypes(new Set<string>());
    setStatRows([{ stat: "hp", op: ">=", value: "" }]);
    setGenOp("=");
    setGenValue("");
    setWeightOp(">=");
    setWeightValue("");
    setHeightOp(">=");
    setHeightValue("");
    setFormat("");
    setStage("");
    setRegion("");
    setEggGroup("");
    setSelectedTags(new Set<string>());
    setColor("");
    setAbility("");
    setMove("");
  }

  return (
    <div class="advanced-search">
      <div class="advanced-header">
        <h1>Advanced Search</h1>
        <a class="back-link" href="#/">
          Back to Search
        </a>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Name */}
        <section class="form-section">
          <label class="section-label">Name</label>
          <input
            class="form-input"
            type="text"
            placeholder={`e.g. ${props.mascotName}`}
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
          />
        </section>

        {/* Type */}
        <section class="form-section">
          <label class="section-label">Type</label>
          <div class="type-grid">
            <For each={[...types]}>
              {(t) => (
                <label
                  class={`type-checkbox ${selectedTypes().has(t) ? "selected" : ""}`}
                  style={{
                    "background-color": selectedTypes().has(t)
                      ? TYPE_COLORS[t]
                      : "transparent",
                    "border-color": TYPE_COLORS[t],
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes().has(t)}
                    onChange={() => toggleType(t)}
                  />
                  {t}
                </label>
              )}
            </For>
          </div>
        </section>

        {/* Stats */}
        <section class="form-section">
          <label class="section-label">Stats</label>
          <For each={statRows()}>
            {(row, i) => (
              <div class="stat-row">
                <select
                  class="form-select stat-select"
                  value={row.stat}
                  onChange={(e) =>
                    updateStatRow(i(), "stat", e.currentTarget.value)
                  }
                >
                  <For each={[...STAT_NAMES]}>
                    {(s) => <option value={s}>{STAT_LABELS[s]}</option>}
                  </For>
                </select>
                <select
                  class="form-select op-select"
                  value={row.op}
                  onChange={(e) =>
                    updateStatRow(i(), "op", e.currentTarget.value)
                  }
                >
                  <For each={[...OPERATORS]}>
                    {(op) => <option value={op}>{op}</option>}
                  </For>
                </select>
                <input
                  class="form-input stat-input"
                  type="text"
                  inputmode="numeric"
                  placeholder="0"
                  value={row.value}
                  onInput={(e) =>
                    updateStatRow(i(), "value", e.currentTarget.value)
                  }
                />
                <button
                  type="button"
                  class="remove-btn"
                  onClick={() => removeStatRow(i())}
                  title="Remove"
                >
                  x
                </button>
              </div>
            )}
          </For>
          <button type="button" class="add-btn" onClick={addStatRow}>
            + Add stat filter
          </button>
        </section>

        {/* Generation */}
        <section class="form-section">
          <label class="section-label">Generation</label>
          <div class="numeric-row">
            <select
              class="form-select op-select"
              value={genOp()}
              onChange={(e) => setGenOp(e.currentTarget.value)}
            >
              <For each={[...OPERATORS]}>
                {(op) => <option value={op}>{op}</option>}
              </For>
            </select>
            <input
              class="form-input stat-input"
              type="text"
              inputmode="numeric"
              placeholder="1-9"
              value={genValue()}
              onInput={(e) => setGenValue(e.currentTarget.value)}
            />
          </div>
        </section>

        {/* Weight / Height */}
        <section class="form-section">
          <label class="section-label">Weight (kg)</label>
          <div class="numeric-row">
            <select
              class="form-select op-select"
              value={weightOp()}
              onChange={(e) => setWeightOp(e.currentTarget.value)}
            >
              <For each={[...OPERATORS]}>
                {(op) => <option value={op}>{op}</option>}
              </For>
            </select>
            <input
              class="form-input stat-input"
              type="text"
              inputmode="decimal"
              placeholder="0"
              value={weightValue()}
              onInput={(e) => setWeightValue(e.currentTarget.value)}
            />
          </div>
        </section>

        <section class="form-section">
          <label class="section-label">Height (m)</label>
          <div class="numeric-row">
            <select
              class="form-select op-select"
              value={heightOp()}
              onChange={(e) => setHeightOp(e.currentTarget.value)}
            >
              <For each={[...OPERATORS]}>
                {(op) => <option value={op}>{op}</option>}
              </For>
            </select>
            <input
              class="form-input stat-input"
              type="text"
              inputmode="decimal"
              placeholder="0"
              value={heightValue()}
              onInput={(e) => setHeightValue(e.currentTarget.value)}
            />
          </div>
        </section>

        {/* Format (Tier + Legality) */}
        <section class="form-section">
          <label class="section-label">Format</label>
          <select
            class="form-select"
            value={format()}
            onChange={(e) => setFormat(e.currentTarget.value)}
          >
            <option value="">Any</option>
            <optgroup label="Formats">
              <For each={FORMAT_OPTIONS}>
                {(f) => <option value={f.value}>{f.label}</option>}
              </For>
            </optgroup>
            <optgroup label="Tiers">
              <For each={DISPLAY_TIERS}>
                {(t) => <option value={t}>{t}</option>}
              </For>
            </optgroup>
          </select>
        </section>

        {/* Stage */}
        <section class="form-section">
          <label class="section-label">Stage</label>
          <select
            class="form-select"
            value={stage()}
            onChange={(e) => setStage(e.currentTarget.value)}
          >
            <option value="">Any</option>
            <For each={[...stages]}>
              {(s) => <option value={s}>{s}</option>}
            </For>
          </select>
        </section>

        {/* Region */}
        <section class="form-section">
          <label class="section-label">Region</label>
          <select
            class="form-select"
            value={region()}
            onChange={(e) => setRegion(e.currentTarget.value)}
          >
            <option value="">Any</option>
            <For each={[...regions]}>
              {(r) => <option value={r}>{r}</option>}
            </For>
          </select>
        </section>

        {/* Egg Group */}
        <section class="form-section">
          <label class="section-label">Egg Group</label>
          <select
            class="form-select"
            value={eggGroup()}
            onChange={(e) => setEggGroup(e.currentTarget.value)}
          >
            <option value="">Any</option>
            <For each={[...eggGroups]}>
              {(eg) => <option value={eg}>{eg}</option>}
            </For>
          </select>
        </section>

        {/* Tags */}
        <section class="form-section">
          <label class="section-label">Tags</label>
          <div class="tag-grid">
            <For each={[...tags]}>
              {(t) => (
                <label
                  class={`tag-checkbox ${selectedTags().has(t) ? "selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTags().has(t)}
                    onChange={() => toggleTag(t)}
                  />
                  {t}
                </label>
              )}
            </For>
          </div>
        </section>

        {/* Color */}
        <section class="form-section">
          <label class="section-label">Color</label>
          <select
            class="form-select"
            value={color()}
            onChange={(e) => setColor(e.currentTarget.value)}
          >
            <option value="">Any</option>
            <For each={[...colors]}>
              {(c) => <option value={c}>{c}</option>}
            </For>
          </select>
        </section>

        {/* Ability */}
        <section class="form-section">
          <label class="section-label">Ability</label>
          <input
            class="form-input"
            type="text"
            placeholder="e.g. Levitate"
            value={ability()}
            onInput={(e) => setAbility(e.currentTarget.value)}
          />
        </section>

        {/* Move */}
        <section class="form-section">
          <label class="section-label">Move</label>
          <input
            class="form-input"
            type="text"
            placeholder="e.g. Earthquake"
            value={move()}
            onInput={(e) => setMove(e.currentTarget.value)}
          />
        </section>

        {/* Actions */}
        <div class="form-actions">
          <button type="submit" class="search-btn">
            Search
          </button>
          <button type="button" class="reset-btn" onClick={handleReset}>
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
