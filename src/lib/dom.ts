/** Tiny DOM helpers.
 *  `$` asserts non-null on purpose: every selector here targets markup that ships
 *  in the same file, so a null return is a bug to crash on, not a case to handle. */
/** Every element this app touches is one it rendered itself, and most call sites
 *  need `.value`, `.disabled` or `.dataset`. Rather than casting at ~200 call
 *  sites, the default element type carries the common form properties. Pass an
 *  explicit type argument when you want the real one. */
export type El = HTMLElement & {
  value: string;
  disabled: boolean;
  checked: boolean;
  selectedIndex: number;
};

export const $ = <T = El>(sel: string): T => document.querySelector(sel) as T;

export const $$ = <T = El>(sel: string): T[] =>
  Array.prototype.slice.call(document.querySelectorAll(sel)) as T[];

export const esc = (s: unknown): string =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const RM: boolean =
  typeof window !== "undefined" &&
  !!window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const STORE_PREFIX = "pb_";

import { isLearningDataKey, markLearningDataChanged } from "./learning-state";

/** localStorage with a namespace and a swallowed failure path (file:// and
 *  private mode both throw). Reading returns null rather than exploding. */
export function store<T = unknown>(key: string): T | null;
export function store<T = unknown>(key: string, value: T): void;
export function store<T = unknown>(key: string, value?: T): T | null | void {
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(STORE_PREFIX + key) ?? "null") as T | null;
    localStorage.setItem(STORE_PREFIX + key, JSON.stringify(value));
    if (isLearningDataKey(key)) markLearningDataChanged(key, localStorage, STORE_PREFIX);
  } catch {
    return null;
  }
}
