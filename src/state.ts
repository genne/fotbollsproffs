import type { AppState } from './types';
import { load, save } from './storage';

type Listener = (state: AppState) => void;

let state: AppState = load();
const listeners = new Set<Listener>();

export function getState(): AppState {
  return state;
}

export function setState(updater: (s: AppState) => AppState): void {
  state = updater(state);
  save(state);
  listeners.forEach((l) => l(state));
}

export function setStateQuiet(updater: (s: AppState) => AppState): void {
  state = updater(state);
  save(state);
}

export function replaceState(next: AppState): void {
  state = next;
  save(state);
  listeners.forEach((l) => l(state));
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
