import type { AppState } from './types';

const KEY = 'fotbollsproffs:v1';

const defaultState: AppState = {
  sessions: [],
  plan: [],
  goalHours: 10000,
  forecastSource: 'plan',
  onboardingDone: false,
};

export function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaultState };
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return { ...defaultState, ...parsed };
  } catch {
    return { ...defaultState };
  }
}

export function save(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function clear(): void {
  localStorage.removeItem(KEY);
}

export function exportJson(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importJson(json: string): AppState {
  const parsed = JSON.parse(json) as Partial<AppState>;
  return { ...defaultState, ...parsed };
}
