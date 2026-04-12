import { createSignal, Show, createEffect } from "solid-js";
import { route } from "./router.ts";
import SearchPage from "./pages/SearchPage.tsx";
import AdvancedSearchPage from "./pages/AdvancedSearchPage.tsx";
import { randomPokemonWithPalette, applyPaletteForSprite } from "./palette.ts";
import type { Pokemon } from "../core/pokemon.ts";

export default function App() {
  const [mascot, setMascot] = createSignal(randomPokemonWithPalette());

  createEffect(() => applyPaletteForSprite(mascot().spriteid));

  const reroll = () => setMascot(randomPokemonWithPalette());

  return (
    <div class="app">
      <Show
        when={route() === "/advanced"}
        fallback={
          <SearchPage
            mascot={mascot()}
            onReroll={reroll}
            onSelectMascot={setMascot}
          />
        }
      >
        <AdvancedSearchPage mascotName={mascot().name} />
      </Show>
    </div>
  );
}
