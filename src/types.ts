export type Category =
  | 'teknik'
  | 'kondition'
  | 'match'
  | 'skott'
  | 'passning'
  | 'frispark'
  | 'annat';

export const CATEGORIES: Category[] = [
  'teknik',
  'kondition',
  'match',
  'skott',
  'passning',
  'frispark',
  'annat',
];

export type TrainingSession = {
  id: string;
  startedAt: string;
  endedAt: string;
  minutes: number;
  category?: Category;
  note?: string;
};

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type PlanEntry = {
  id: string;
  weekday: Weekday;
  startTime: string;
  durationMin: number;
  kind: 'ordinarie' | 'extra';
  label?: string;
};

export type PriorEstimateAnswers = {
  ageNow: number;
  ageStart: number;
  trainingsPerWeek: number;
  minPerTraining: number;
  matchesPerMonth: number;
  minPerMatch: number;
  schoolDaysPerWeek: number;
  minPerBreak: number;
  homeDaysPerWeek: number;
  minPerHomeSession: number;
  seasonFactor: number;
};

export type PriorEstimate = {
  answeredAt: string;
  answers: PriorEstimateAnswers;
  hours: number;
  breakdown: {
    organized: number;
    match: number;
    breaks: number;
    home: number;
  };
};

export type ForecastSource = 'plan' | 'recent';

export type AppState = {
  activeSession?: { startedAt: string };
  sessions: TrainingSession[];
  plan: PlanEntry[];
  priorEstimate?: PriorEstimate;
  goalHours: number;
  forecastSource: ForecastSource;
  onboardingDone: boolean;
};

export const WEEKDAY_NAMES: Record<Weekday, string> = {
  0: 'Söndag',
  1: 'Måndag',
  2: 'Tisdag',
  3: 'Onsdag',
  4: 'Torsdag',
  5: 'Fredag',
  6: 'Lördag',
};
