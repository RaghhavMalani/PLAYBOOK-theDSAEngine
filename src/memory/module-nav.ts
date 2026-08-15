/**
 * A sticky module nav for the memory page.
 *
 * The page started at six modules and is now eleven, several of which are long
 * enough to scroll past on their own. At that length a single vertical scroll stops
 * being a document and starts being a haystack, so this builds a slim bar that says
 * where you are and lets you jump.
 *
 * Three deliberate choices:
 *
 *   The bar is BUILT FROM THE DOM, not from a hardcoded list. Add a section to
 *   memory.html with an id and an h2 and it appears here automatically — a
 *   hardcoded list would silently fall out of date the first time someone adds a
 *   module, which is exactly the kind of rot this codebase keeps hitting.
 *
 *   Highlighting uses IntersectionObserver rather than a scroll handler, so the
 *   browser does the work off the main thread and there is no listener firing
 *   dozens of times a second. Where it is unavailable the bar still renders and
 *   still navigates; it just does not highlight.
 *
 *   Real anchors, not buttons with click handlers, so middle-click, ctrl-click and
 *   keyboard focus all behave the way they should for free.
 */

import { esc } from "../lib/dom";

/** Sections that are chrome rather than content, and never worth linking to. */
const SKIP = new Set(["hero", "lladder", "etLadder", "mdLadder"]);

interface Item {
  id: string;
  label: string;
  el: HTMLElement;
}

/** Read the modules straight out of the page. */
function collect(): Item[] {
  const out: Item[] = [];
  document.querySelectorAll<HTMLElement>("section[id]").forEach((sec) => {
    if (SKIP.has(sec.id)) return;
    const h = sec.querySelector("h2.mod");
    if (!h) return;
    // h2s here contain <br> and <em>; textContent flattens both, then collapse space
    const label = (h.textContent ?? "").replace(/\s+/g, " ").trim();
    if (label) out.push({ id: sec.id, label, el: sec });
  });
  return out;
}

/** Shorten a display heading into something that fits a nav chip. */
function chipLabel(label: string): string {
  const short = label
    .replace(/^The /i, "")
    .replace(/\?$/, "")
    .trim();
  return short.length > 26 ? short.slice(0, 25).trimEnd() + "…" : short;
}

export function initModuleNav(): void {
  const items = collect();
  if (items.length < 3) return; // not worth a nav

  const nav = document.createElement("nav");
  nav.className = "modnav";
  nav.setAttribute("aria-label", "Modules on this page");
  nav.innerHTML = `<div class="modnav-in">${items
    .map(
      (it, i) =>
        `<a class="modnav-a" href="#${esc(it.id)}" data-for="${esc(it.id)}">
           <span class="modnav-n">${String(i + 1).padStart(2, "0")}</span>${esc(chipLabel(it.label))}
         </a>`,
    )
    .join("")}</div>`;

  // ahead of the first module, so it sticks from the top of the content down
  const first = items[0].el;
  first.parentNode?.insertBefore(nav, first);

  const links = new Map<string, HTMLElement>();
  nav.querySelectorAll<HTMLElement>("[data-for]").forEach((a) => links.set(a.dataset.for!, a));

  const setActive = (id: string): void => {
    links.forEach((a, key) => a.classList.toggle("on", key === id));
    // keep the active chip visible when the bar itself has scrolled
    const a = links.get(id);
    const box = nav.querySelector<HTMLElement>(".modnav-in");
    if (a && box && box.scrollWidth > box.clientWidth) {
      const target = a.offsetLeft - box.clientWidth / 2 + a.offsetWidth / 2;
      box.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    }
  };

  if (!("IntersectionObserver" in window)) {
    setActive(items[0].id);
    return;
  }

  /* Track how much of each section is on screen and highlight the largest, rather
   * than "the first one intersecting" — with sections this tall, the naive version
   * highlights a module you scrolled past minutes ago. */
  const ratio = new Map<string, number>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) ratio.set((e.target as HTMLElement).id, e.intersectionRatio);
      let bestId = "";
      let best = -1;
      ratio.forEach((r, id) => {
        if (r > best) { best = r; bestId = id; }
      });
      if (bestId && best > 0) setActive(bestId);
    },
    { threshold: [0, 0.05, 0.25, 0.5, 0.75, 1], rootMargin: "-80px 0px -55% 0px" },
  );
  items.forEach((it) => io.observe(it.el));
}
