import type { Category, TrainingSession } from './types';
import { getState, setState, uid } from './state';

export function startSession(): void {
  const s = getState();
  if (s.activeSession) return;
  setState((st) => ({
    ...st,
    activeSession: { startedAt: new Date().toISOString() },
  }));
}

export function cancelSession(): void {
  setState((st) => ({ ...st, activeSession: undefined }));
}

export type StopResult =
  | { saved: true; session: TrainingSession }
  | { saved: false; reason: 'no-active' | 'too-short'; minutes?: number };

export function stopSession(
  category?: Category,
  note?: string,
  allowShort = false,
): StopResult {
  const s = getState();
  if (!s.activeSession) return { saved: false, reason: 'no-active' };

  const startedAt = s.activeSession.startedAt;
  const endedAt = new Date().toISOString();
  const minutes = Math.round(
    (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000,
  );

  if (minutes < 1 && !allowShort) {
    return { saved: false, reason: 'too-short', minutes };
  }

  const session: TrainingSession = {
    id: uid(),
    startedAt,
    endedAt,
    minutes: Math.max(1, minutes),
    category,
    note: note?.trim() || undefined,
  };

  setState((st) => ({
    ...st,
    activeSession: undefined,
    sessions: [session, ...st.sessions],
  }));

  return { saved: true, session };
}

export function elapsedMinutes(startedAt: string): number {
  return (Date.now() - new Date(startedAt).getTime()) / 60000;
}

export function formatElapsed(startedAt: string): string {
  const totalSec = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}
