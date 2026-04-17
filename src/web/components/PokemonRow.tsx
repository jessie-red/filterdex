import { Show } from "solid-js";
import type { Pokemon } from "../../core/pokemon.ts";
import TypeBadge from "./TypeBadge.tsx";
import MoveCard from "./MoveCard.tsx";
import { spriteUrl } from "../sprites.ts";

const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;

export default function PokemonRow(props: {
  pokemon: Pokemon;
  expanded: boolean;
  onSelect(p: Pokemon): void;
  onSearch(query: string): void;
  onToggle(): void;
}) {
  const p = props.pokemon;
  const allAbilities = [p.abilities[0], p.abilities[1]].filter(
    (a): a is string => Boolean(a),
  );
  const hiddenAbility = p.abilities.H;
  const bst = STAT_KEYS.reduce((sum, k) => sum + p.baseStats[k], 0);

  return (
    <div class={`pokemon-row-wrapper${props.expanded ? " expanded" : ""}`}>
      <div class="pokemon-row" onClick={props.onToggle}>
        <span class="dex-num">{String(p.num).padStart(4, "0")}</span>
        <img
          class="sprite"
          src={spriteUrl(p.spriteid)}
          alt={p.name}
          loading="lazy"
          onClick={(e) => {
            e.stopPropagation();
            props.onSelect(p);
          }}
          onError={(e) => (e.currentTarget.style.visibility = "hidden")}
        />
        <span class="name-col name">{p.name}</span>
        <span class="types">
          {p.types.map(
            (t) => t && <TypeBadge type={t} onSearch={props.onSearch} />,
          )}
        </span>
        <span class="abilities">
          {allAbilities.map((a, i) => (
            <>
              {i > 0 && " / "}
              <span
                class="clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onSearch(`ability:${a.toLowerCase()}`);
                }}
              >
                {a}
              </span>
            </>
          ))}
        </span>
        <span class="hidden-ability">
          {hiddenAbility && (
            <span
              class="clickable"
              onClick={(e) => {
                e.stopPropagation();
                props.onSearch(`ability:${hiddenAbility.toLowerCase()}`);
              }}
            >
              {hiddenAbility}
            </span>
          )}
        </span>
        <div class="stats">
          {STAT_KEYS.map((key) => (
            <span class="stat-value">{p.baseStats[key]}</span>
          ))}
          <span class="stat-value bst-value">{bst}</span>
        </div>
      </div>
      <Show when={props.expanded}>
        <MoveCard moves={p.moves} onSearch={props.onSearch} />
      </Show>
    </div>
  );
}
