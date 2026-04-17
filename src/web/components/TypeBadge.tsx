import type { Type } from "../../core/pokemon.ts";

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

export default function TypeBadge(props: {
  type: Type;
  onSearch?: (query: string) => void;
}) {
  return (
    <span
      class={`type-badge${props.onSearch ? " clickable" : ""}`}
      style={{ "background-color": TYPE_COLORS[props.type] }}
      onClick={(e) => {
        if (!props.onSearch) return;
        e.stopPropagation();
        props.onSearch(`type:${props.type.toLowerCase()}`);
      }}
    >
      {props.type}
    </span>
  );
}
