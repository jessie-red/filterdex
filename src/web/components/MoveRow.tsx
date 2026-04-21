import type { MoveInfo } from "../../build/moves.ts";
import type { Type } from "../../core/pokemon.ts";
import TypeBadge from "./TypeBadge.tsx";
import physicalIcon from "../../../buildData/icons/physical.svg";
import specialIcon from "../../../buildData/icons/special.svg";
import statusIcon from "../../../buildData/icons/status.svg";

const CATEGORY_ICONS: Record<MoveInfo["category"], string> = {
  Physical: physicalIcon,
  Special: specialIcon,
  Status: statusIcon,
};

export default function MoveRow(props: {
  name: string;
  info: MoveInfo;
  onSearch(query: string): void;
}) {
  const m = props.info;
  return (
    <div
      class="move-row clickable"
      onClick={() => props.onSearch(`move:${props.name.toLowerCase()}`)}
    >
      <span class="move-name">{props.name}</span>
      <span class="move-type-col">
        <TypeBadge type={m.type as Type} />
      </span>
      <span class="move-category-col">
        <img
          class="category-icon"
          src={CATEGORY_ICONS[m.category]}
          alt={m.category}
          title={m.category}
        />
      </span>
      <span class="move-stat">{m.basePower || "\u2014"}</span>
      <span class="move-stat">
        {m.accuracy === true ? "\u2014" : `${m.accuracy}%`}
      </span>
      <span class="move-stat">{m.pp}</span>
      <span class="move-desc">{m.shortDesc}</span>
    </div>
  );
}
