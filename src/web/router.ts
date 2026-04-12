import { createSignal } from "solid-js";

function getHash(): string {
  const hash = window.location.hash.slice(1);
  return hash.split("?")[0] || "/";
}

const [route, setRoute] = createSignal(getHash());

window.addEventListener("hashchange", () => setRoute(getHash()));

function navigate(path: string, queryString?: string) {
  window.location.hash = queryString ? `${path}?${queryString}` : path;
}

function getQueryParam(key: string): string | null {
  const hash = window.location.hash.slice(1);
  const qIndex = hash.indexOf("?");
  if (qIndex === -1) return null;
  const params = new URLSearchParams(hash.slice(qIndex + 1));
  return params.get(key);
}

export { route, navigate, getQueryParam };
