import type { Pokemon } from "../../core/pokemon.ts";
import TypeBadge from "./TypeBadge.tsx";
import { spriteUrl } from "../sprites.ts";

const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;

export default function PokemonRow(props: {
  pokemon: Pokemon;
  onSelect(p: Pokemon): void;
}) {
  const p = props.pokemon;
  const abilities = [p.abilities[0], p.abilities[1]]
    .filter(Boolean)
    .join(" / ");
  const hiddenAbility = p.abilities.H;
  const bst = STAT_KEYS.reduce((sum, k) => sum + p.baseStats[k], 0);

  return (
    <div class="pokemon-row">
      <span class="dex-num">{String(p.num).padStart(4, "0")}</span>
      <img
        class="sprite"
        src={spriteUrl(p.spriteid)}
        alt={p.name}
        loading="lazy"
        onClick={() => props.onSelect(p)}
        onError={(e) => (e.currentTarget.style.visibility = "hidden")}
      />
      <span class="name-col name">{p.name}</span>
      <span class="types">
        {p.types.map((t) => t && <TypeBadge type={t} />)}
      </span>
      <span class="abilities">{abilities}</span>
      <span class="hidden-ability">{hiddenAbility}</span>
      <div class="stats">
        {STAT_KEYS.map((key) => (
          <span class="stat-value">{p.baseStats[key]}</span>
        ))}
        <span class="stat-value bst-value">{bst}</span>
      </div>
    </div>
  );
}
