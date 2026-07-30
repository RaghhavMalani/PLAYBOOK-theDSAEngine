/**
 * Turns every worked trace into a step-through player.
 *
 * The 109 traces were already frame-shaped — each `rows` entry is one step of the
 * algorithm — they were just being rendered as dead tables. This adds transport
 * controls, progressive row reveal and keyboard scrubbing on top of the existing
 * markup, so no content had to be written and no renderer had to change.
 *
 * It attaches via MutationObserver rather than by hooking the pattern renderer.
 * `patterns.ts` and `primers.ts` build their HTML as strings and swap innerHTML;
 * observing the container means traces animate wherever they appear, now and in any
 * view added later, with zero coupling.
 *
 * Future rows keep their height at low opacity rather than being hidden. Collapsing
 * them makes the panel jump on every step, which is far more distracting than the
 * animation is useful.
 */

const REDUCED =
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

interface Player {
  step: number;
  total: number;
  timer: number | null;
}

const players = new WeakMap<HTMLTableElement, Player>();

function paint(table: HTMLTableElement, p: Player, bar: HTMLElement): void {
  const rows = [...table.querySelectorAll<HTMLTableRowElement>("tr")].slice(1);
  rows.forEach((tr, i) => {
    tr.classList.toggle("tp-now", i === p.step);
    tr.classList.toggle("tp-past", i < p.step);
    tr.classList.toggle("tp-next", i > p.step);
  });
  const counter = bar.querySelector(".tp-count");
  if (counter) counter.textContent = `${p.step + 1} / ${p.total}`;
  const fill = bar.querySelector<HTMLElement>(".tp-fill");
  if (fill) fill.style.width = `${((p.step + 1) / p.total) * 100}%`;
  const play = bar.querySelector<HTMLButtonElement>("[data-tp=play]");
  if (play) play.textContent = p.timer ? "❚❚ pause" : "▶ play";
}

function stop(p: Player): void {
  if (p.timer) {
    clearInterval(p.timer);
    p.timer = null;
  }
}

function enhance(table: HTMLTableElement): void {
  if (players.has(table)) return;
  const rows = [...table.querySelectorAll<HTMLTableRowElement>("tr")].slice(1);
  if (rows.length < 2) return; // a one-row trace has nothing to step through

  const p: Player = { step: REDUCED ? rows.length - 1 : 0, total: rows.length, timer: null };
  players.set(table, p);
  table.classList.add("tp-on");

  const bar = document.createElement("div");
  bar.className = "tp-bar";
  bar.innerHTML =
    `<button class="tp-btn" data-tp="prev" aria-label="previous step">◀</button>` +
    `<button class="tp-btn" data-tp="play" aria-label="play or pause">▶ play</button>` +
    `<button class="tp-btn" data-tp="next" aria-label="next step">▶</button>` +
    `<span class="tp-count"></span>` +
    `<span class="tp-track"><i class="tp-fill"></i></span>` +
    `<span class="tp-hint">← → to step</span>`;
  table.parentElement?.insertBefore(bar, table);

  const go = (n: number): void => {
    p.step = Math.max(0, Math.min(p.total - 1, n));
    paint(table, p, bar);
  };

  bar.addEventListener("click", (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-tp]");
    if (!el) return;
    const what = el.dataset.tp;
    if (what === "prev") {
      stop(p);
      go(p.step - 1);
    } else if (what === "next") {
      stop(p);
      go(p.step + 1);
    } else if (what === "play") {
      if (p.timer) {
        stop(p);
      } else {
        // restarting from the end should replay, not sit still
        if (p.step >= p.total - 1) p.step = -1;
        p.timer = window.setInterval(() => {
          if (p.step >= p.total - 1) {
            stop(p);
            paint(table, p, bar);
            return;
          }
          go(p.step + 1);
        }, 900);
      }
      paint(table, p, bar);
    }
  });

  // click a row to jump straight to that step
  rows.forEach((tr, i) => {
    tr.addEventListener("click", () => {
      stop(p);
      go(i);
    });
  });

  // Keyboard only while the pointer is over this trace, so two traces on one page
  // never fight over the arrow keys.
  const wrapEl = table.parentElement;
  if (wrapEl) {
    wrapEl.addEventListener("mouseenter", () => wrapEl.classList.add("tp-hot"));
    wrapEl.addEventListener("mouseleave", () => wrapEl.classList.remove("tp-hot"));
  }

  paint(table, p, bar);
}

function enhanceAll(root: ParentNode): void {
  root.querySelectorAll<HTMLTableElement>("table.walkt").forEach(enhance);
}

export function initTracePlay(): void {
  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeType === 1) enhanceAll(n as ParentNode);
      }
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
  enhanceAll(document);

  document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    const hot = document.querySelector(".tp-hot table.walkt") as HTMLTableElement | null;
    if (!hot) return;
    const p = players.get(hot);
    const bar = hot.parentElement?.querySelector<HTMLElement>(".tp-bar");
    if (!p || !bar) return;
    e.preventDefault();
    stop(p);
    p.step = Math.max(0, Math.min(p.total - 1, p.step + (e.key === "ArrowRight" ? 1 : -1)));
    paint(hot, p, bar);
  });
}
