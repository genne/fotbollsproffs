import type { AppState, PlanEntry, TrainingSession } from './types';

export type Forecast = {
  totalHours: number;
  priorHours: number;
  loggedHours: number;
  remainingHours: number;
  hoursPerWeekPlan: number;
  hoursPerWeekRecent: number;
  hoursPerWeekUsed: number;
  etaDate?: Date;
  weeksToGoal?: number;
  progressPct: number;
};

function planHoursPerWeek(plan: PlanEntry[]): number {
  return plan.reduce((sum, p) => sum + p.durationMin / 60, 0);
}

function recentHoursPerWeek(sessions: TrainingSession[]): number {
  const fourWeeksMs = 28 * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - fourWeeksMs;
  const recent = sessions.filter(
    (s) => new Date(s.endedAt).getTime() >= cutoff,
  );
  const minutes = recent.reduce((sum, s) => sum + s.minutes, 0);
  return minutes / 60 / 4;
}

export function computeForecast(state: AppState): Forecast {
  const priorHours = state.priorEstimate?.hours ?? 0;
  const loggedMinutes = state.sessions.reduce((sum, s) => sum + s.minutes, 0);
  const loggedHours = loggedMinutes / 60;
  const totalHours = priorHours + loggedHours;
  const remainingHours = Math.max(0, state.goalHours - totalHours);

  const hoursPerWeekPlan = planHoursPerWeek(state.plan);
  const hoursPerWeekRecent = recentHoursPerWeek(state.sessions);

  const hoursPerWeekUsed =
    state.forecastSource === 'plan' ? hoursPerWeekPlan : hoursPerWeekRecent;

  let etaDate: Date | undefined;
  let weeksToGoal: number | undefined;
  if (remainingHours > 0 && hoursPerWeekUsed > 0) {
    weeksToGoal = remainingHours / hoursPerWeekUsed;
    etaDate = new Date(Date.now() + weeksToGoal * 7 * 24 * 60 * 60 * 1000);
  } else if (remainingHours === 0) {
    weeksToGoal = 0;
    etaDate = new Date();
  }

  const progressPct = Math.min(100, (totalHours / state.goalHours) * 100);

  return {
    totalHours,
    priorHours,
    loggedHours,
    remainingHours,
    hoursPerWeekPlan,
    hoursPerWeekRecent,
    hoursPerWeekUsed,
    etaDate,
    weeksToGoal,
    progressPct,
  };
}

export function formatHours(hours: number): string {
  if (hours < 10) return hours.toFixed(1);
  return Math.round(hours).toLocaleString('sv-SE');
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
