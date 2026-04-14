import { getState, setState, setStateQuiet } from '../state';
import { computeEstimate, DEFAULT_ANSWERS, etaFromAnswers } from '../estimator';
import type { PriorEstimateAnswers } from '../types';

function motivate(p: number): string {
  if (p < 5) return 'Resan börjar nu!';
  if (p < 15) return 'Bra start!';
  if (p < 25) return 'Håll i det!';
  if (p < 40) return 'Du är grym!';
  if (p < 60) return 'Halvvägs mot proffs!';
  if (p < 80) return 'Nästan proffs!';
  return 'LEGENDARISK!';
}

function formatNum(n: number): string {
  return Math.round(n).toLocaleString('sv-SE');
}

export function renderEstimate(root: HTMLElement, onDone: () => void): void {
  const existing = getState().priorEstimate?.answers;
  let a: PriorEstimateAnswers = existing ? { ...existing } : { ...DEFAULT_ANSWERS };

  const persist = () => {
    setStateQuiet((s) => ({ ...s, priorEstimate: computeEstimate(a) }));
  };

  root.innerHTML = `
    <h2 class="sr-only">Fotbollsproffs – timräknare</h2>

    <div class="brand">
      <div class="brand-logo">
        <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" fill="white" opacity="0.15"/>
          <circle cx="16" cy="16" r="13" stroke="white" stroke-width="1.5" fill="none"/>
          <polygon points="16,6 19.5,12 16,14.5 12.5,12" fill="white"/>
          <polygon points="22.5,11 27,13.5 26,18.5 22.5,17" fill="white" opacity="0.85"/>
          <polygon points="9.5,11 7,18.5 6,13.5 9.5,11" fill="white" opacity="0.85"/>
          <polygon points="20,22 16,26 12,22 13,18 19,18" fill="white" opacity="0.85"/>
          <line x1="16" y1="14.5" x2="16" y2="18" stroke="white" stroke-width="1" opacity="0.5"/>
          <line x1="19.5" y1="12" x2="22.5" y2="11" stroke="white" stroke-width="1" opacity="0.5"/>
          <line x1="12.5" y1="12" x2="9.5" y2="11" stroke="white" stroke-width="1" opacity="0.5"/>
        </svg>
      </div>
      <div>
        <h1>Fotbollsproffs</h1>
        <p class="muted">Räkna dina timmar mot toppen</p>
      </div>
    </div>

    <div class="hero">
      <div class="deco-ring"></div>
      <div class="deco-line"></div>
      <p class="hero-kicker">Dina fotbollstimmar</p>
      <div class="hero-total">
        <span class="num" id="total-h">0</span>
        <span class="unit">h</span>
      </div>
      <p class="hero-sub">Vägen mot proffs · 10 000h</p>
      <div class="hero-bar-bg">
        <div class="hero-bar-fill" id="progress-bar"></div>
      </div>
      <p class="hero-pct" id="progress-pct">0.0% – Resan börjar nu!</p>
      <div class="hero-eta" id="hero-eta" style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.1);">
        <p class="hero-kicker" style="margin:0 0 2px;">Om du fortsätter i samma tempo</p>
        <p class="hero-eta-text" id="eta-text" style="color:#fff; font-size:14px; font-weight:500; margin:0;">—</p>
      </div>
    </div>

    <div class="pair-grid">
      <div class="ft-card">
        <p class="ft-label">Ålder nu</p>
        <input class="ft-input" type="number" data-k="ageNow" min="5" max="60" value="${a.ageNow}" />
      </div>
      <div class="ft-card">
        <p class="ft-label">Började spela vid</p>
        <input class="ft-input" type="number" data-k="ageStart" min="2" max="30" value="${a.ageStart}" />
      </div>
    </div>

    <div class="ft-card" style="border-left: 3px solid #2D5E0F;">
      <div class="ft-cat-header">
        <div class="ft-icon" style="background:#E2F0D0;">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="#2D5E0F">
            <rect x="7" y="1" width="2" height="14" rx="1"/>
            <rect x="1" y="7" width="14" height="2" rx="1"/>
          </svg>
        </div>
        <p class="ft-cat-title">Organiserad träning</p>
        <span class="ft-hours-badge" id="org-h" style="color:#2D5E0F;">0 h</span>
      </div>
      <div class="ft-card-pair">
        <div>
          <p class="ft-label">Träningar / vecka</p>
          <input class="ft-input" type="number" data-k="trainingsPerWeek" min="0" max="14" value="${a.trainingsPerWeek}" />
        </div>
        <div>
          <p class="ft-label">Min per träning</p>
          <input class="ft-input" type="number" data-k="minPerTraining" min="0" max="240" value="${a.minPerTraining}" />
        </div>
      </div>
    </div>

    <div class="ft-card" style="border-left: 3px solid #A05E12;">
      <div class="ft-cat-header">
        <div class="ft-icon" style="background:#FAEEDE;">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" fill="#A05E12"/>
            <circle cx="8" cy="8" r="3.5" stroke="#FAEEDE" stroke-width="1.2" fill="none"/>
            <path d="M8 1V3.5M8 12.5V15M1 8H3.5M12.5 8H15" stroke="#FAEEDE" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </div>
        <p class="ft-cat-title">Match</p>
        <span class="ft-hours-badge" id="match-h" style="color:#7A440C;">0 h</span>
      </div>
      <div class="ft-card-pair">
        <div>
          <p class="ft-label">Matcher / månad</p>
          <input class="ft-input" type="number" data-k="matchesPerMonth" min="0" max="30" value="${a.matchesPerMonth}" />
        </div>
        <div>
          <p class="ft-label">Min per match</p>
          <input class="ft-input" type="number" data-k="minPerMatch" min="0" max="120" value="${a.minPerMatch}" />
        </div>
      </div>
    </div>

    <div class="ft-card" style="border-left: 3px solid #1A5FA0;">
      <div class="ft-cat-header">
        <div class="ft-icon" style="background:#DEEAF8;">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="14" height="14" rx="2" fill="#1A5FA0"/>
            <path d="M1 6H15M6 1V15" stroke="#fff" stroke-width="1.3"/>
          </svg>
        </div>
        <p class="ft-cat-title">På raster i skolan</p>
        <span class="ft-hours-badge" id="school-h" style="color:#1A5FA0;">0 h</span>
      </div>
      <div class="ft-card-pair">
        <div>
          <p class="ft-label">Skoldagar / vecka</p>
          <input class="ft-input" type="number" data-k="schoolDaysPerWeek" min="0" max="7" value="${a.schoolDaysPerWeek}" />
        </div>
        <div>
          <p class="ft-label">Min per dag</p>
          <input class="ft-input" type="number" data-k="minPerBreak" min="0" max="180" value="${a.minPerBreak}" />
        </div>
      </div>
    </div>

    <div class="ft-card" style="border-left: 3px solid #8F3455;">
      <div class="ft-cat-header">
        <div class="ft-icon" style="background:#F8E0EC;">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="#8F3455">
            <path d="M1 9L8 2L15 9V15H10V10H6V15H1V9Z"/>
          </svg>
        </div>
        <p class="ft-cat-title">Hemma / med kompisar</p>
        <span class="ft-hours-badge" id="home-h" style="color:#8F3455;">0 h</span>
      </div>
      <div class="ft-card-pair">
        <div>
          <p class="ft-label">Dagar / vecka</p>
          <input class="ft-input" type="number" data-k="homeDaysPerWeek" min="0" max="7" value="${a.homeDaysPerWeek}" />
        </div>
        <div>
          <p class="ft-label">Min per gång</p>
          <input class="ft-input" type="number" data-k="minPerHomeSession" min="0" max="240" value="${a.minPerHomeSession}" />
        </div>
      </div>
    </div>

    <div class="ft-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <p class="ft-cat-title">Säsongsjustering</p>
        <span class="season-value" id="season-v">${a.seasonFactor.toFixed(1)}</span>
      </div>
      <input type="range" data-k="seasonFactor" min="0.3" max="1" step="0.05" value="${a.seasonFactor}" />
      <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--color-text-secondary); margin-top:4px;">
        <span>Uppehåll</span><span>Hela året</span>
      </div>
    </div>

    <div class="tip">
      <div class="tip-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#8DC845"/>
        </svg>
      </div>
      <div>
        <p class="tip-title">Visste du det här?</p>
        <p class="tip-body">Messi, Ronaldo och Haaland tränade alla <strong style="color:var(--color-accent-dark);">minst 10 000 timmar</strong> innan de blev proffs. Du är redan på väg!</p>
      </div>
    </div>

    <button class="primary big" id="save">Spara och börja!</button>
    <p style="text-align:center; margin: 8px 0 0;">
      <button class="link" id="skip">Hoppa över</button>
    </p>
  `;

  const recalc = () => {
    const e = computeEstimate(a);
    const pct = Math.min(100, (e.hours / 10000) * 100);
    (root.querySelector('#total-h') as HTMLElement).textContent = formatNum(e.hours);
    (root.querySelector('#org-h') as HTMLElement).textContent = `${formatNum(e.breakdown.organized)} h`;
    (root.querySelector('#match-h') as HTMLElement).textContent = `${formatNum(e.breakdown.match)} h`;
    (root.querySelector('#school-h') as HTMLElement).textContent = `${formatNum(e.breakdown.breaks)} h`;
    (root.querySelector('#home-h') as HTMLElement).textContent = `${formatNum(e.breakdown.home)} h`;
    (root.querySelector('#progress-bar') as HTMLElement).style.width = `${pct.toFixed(1)}%`;
    (root.querySelector('#progress-pct') as HTMLElement).textContent = `${pct.toFixed(1)}% – ${motivate(pct)}`;

    const eta = etaFromAnswers(a, e.hours);
    const etaEl = root.querySelector('#eta-text') as HTMLElement;
    if (!eta) {
      etaEl.textContent = 'Fyll i träningstempo för att se ETA';
    } else if (eta.weeks === 0) {
      etaEl.textContent = 'Du är där!';
    } else {
      const years = (eta.weeks / 52);
      const when = eta.date.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' });
      etaEl.innerHTML = `Du når 10 000h <strong>${when}</strong><br><span style="color:rgba(255,255,255,0.55); font-size:12px;">om ${years.toFixed(1)} år · ${eta.weeklyHours.toFixed(1)} h/vecka</span>`;
    }
  };

  root.querySelectorAll<HTMLInputElement>('input[data-k]').forEach((inp) => {
    inp.addEventListener('input', () => {
      const k = inp.dataset.k as keyof PriorEstimateAnswers;
      const v = Number(inp.value);
      if (!Number.isFinite(v)) return;
      a = { ...a, [k]: v };
      if (k === 'seasonFactor') {
        (root.querySelector('#season-v') as HTMLElement).textContent = v.toFixed(1);
      }
      recalc();
      persist();
    });
  });

  root.querySelector<HTMLButtonElement>('#save')?.addEventListener('click', () => {
    const final = computeEstimate(a);
    setState((s) => ({ ...s, priorEstimate: final, onboardingDone: true }));
    onDone();
  });
  root.querySelector<HTMLButtonElement>('#skip')?.addEventListener('click', () => {
    setState((s) => ({ ...s, onboardingDone: true }));
    onDone();
  });

  recalc();
}
