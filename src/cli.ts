import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { searchPokemon } from "./core/search.ts";

const rl = createInterface({ input: stdin, output: stdout });

while (true) {
  const query = await rl.question("> ");
  if (query === "quit" || query === "exit") break;
  const { results } = searchPokemon(query);
  for (const p of results) {
    console.log(p.id);
  }
}

rl.close();
