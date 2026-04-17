import { createSignal, Show, createEffect } from "solid-js";
import { route, navigate } from "./router.ts";
import SearchPage from "./pages/SearchPage.tsx";
import AdvancedSearchPage from "./pages/AdvancedSearchPage.tsx";
import { randomPokemonWithPalette, applyPaletteForSprite } from "./palette.ts";
import type { Pokemon } from "../core/pokemon.ts";

export default function App() {
  const [mascot, setMascot] = createSignal(randomPokemonWithPalette());
  const [injectedQuery, setInjectedQuery] = createSignal("");

  createEffect(() => applyPaletteForSprite(mascot().spriteid));

  const reroll = () => setMascot(randomPokemonWithPalette());

  function handleSearch(query: string) {
    setInjectedQuery(query);
    navigate("/");
  }

  return (
    <div class="app">
      <header class="site-header">
        <div class="site-title">FilterDex</div>
        <div
          class="site-byline"
          onClick={() => setInjectedQuery("ability:filter")}
        >
          the search tool that takes 3/4 damage from supereffective attacks
        </div>
      </header>
      <Show
        when={route() === "/advanced"}
        fallback={
          <SearchPage
            mascot={mascot()}
            onReroll={reroll}
            onSelectMascot={setMascot}
            injectedQuery={injectedQuery()}
          />
        }
      >
        <AdvancedSearchPage
          mascotName={mascot().name}
          onSearch={handleSearch}
        />
      </Show>
    </div>
  );
}
