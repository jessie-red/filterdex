import { Show } from "solid-js";
import { route } from "./router.ts";
import SearchPage from "./pages/SearchPage.tsx";
import AdvancedSearchPage from "./pages/AdvancedSearchPage.tsx";

export default function App() {
  return (
    <div class="app">
      <Show when={route() === "/advanced"} fallback={<SearchPage />}>
        <AdvancedSearchPage />
      </Show>
    </div>
  );
}
