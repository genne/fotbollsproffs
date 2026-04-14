import type { PriorEstimate, PriorEstimateAnswers } from './types';

const WEEKS_PER_YEAR = 45;
const SCHOOL_WEEKS_PER_YEAR = 40;
const MONTHS_PER_YEAR = 12;

export const DEFAULT_ANSWERS: PriorEstimateAnswers = {
  ageNow: 14,
  ageStart: 6,
  trainingsPerWeek: 2,
  minPerTraining: 75,
  matchesPerMonth: 4,
  minPerMatch: 60,
  schoolDaysPerWeek: 3,
  minPerBreak: 20,
  homeDaysPerWeek: 2,
  minPerHomeSession: 30,
  seasonFactor: 0.9,
};

export function computeEstimate(a: PriorEstimateAnswers): PriorEstimate {
  const years = Math.max(0, a.ageNow - a.ageStart);

  const organized =
    (years * WEEKS_PER_YEAR * a.trainingsPerWeek * a.minPerTraining) / 60;
  const match =
    (years * MONTHS_PER_YEAR * a.matchesPerMonth * a.minPerMatch) / 60;
  const breaks =
    (years * SCHOOL_WEEKS_PER_YEAR * a.schoolDaysPerWeek * a.minPerBreak) / 60;
  const home =
    (years * WEEKS_PER_YEAR * a.homeDaysPerWeek * a.minPerHomeSession) / 60;

  const rawHours = organized + match + breaks + home;
  const hours = Math.max(0, rawHours * a.seasonFactor);

  return {
    answeredAt: new Date().toISOString(),
    answers: a,
    hours,
    breakdown: {
      organized: organized * a.seasonFactor,
      match: match * a.seasonFactor,
      breaks: breaks * a.seasonFactor,
      home: home * a.seasonFactor,
    },
  };
}
