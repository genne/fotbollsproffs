import { setState } from '../state';
import { computeEstimate, DEFAULT_ANSWERS } from '../estimator';
import type { PriorEstimateAnswers } from '../types';
import { formatHours } from '../forecast';

export function renderEstimate(root: HTMLElement, onDone: () => void): void {
  let a: PriorEstimateAnswers = { ...DEFAULT_ANSWERS };

  const draw = () => {
    const e = computeEstimate(a);
    root.innerHTML = `
      <section class="card">
        <h1>Så långt har du redan kommit</h1>
        <p>Svara så gott du kan – vi använder det som startpunkt. Du kan ändra detta senare i Inställningar.</p>
      </section>

      <section class="card">
        <h2>Organiserad träning</h2>
        <div class="grid-2">
          <div class="field"><label>Din ålder nu</label><input type="number" min="4" max="80" data-k="ageNow" value="${a.ageNow}" /></div>
          <div class="field"><label>Började fotboll vid</label><input type="number" min="3" max="60" data-k="ageStart" value="${a.ageStart}" /></div>
          <div class="field"><label>Träningar/vecka (snitt)</label><input type="number" min="0" max="14" data-k="trainingsPerWeek" value="${a.trainingsPerWeek}" /></div>
          <div class="field"><label>Minuter per träning</label><input type="number" min="15" max="240" data-k="minPerTraining" value="${a.minPerTraining}" /></div>
        </div>
      </section>

      <section class="card">
        <h2>Match</h2>
        <div class="grid-2">
          <div class="field"><label>Matcher/månad</label><input type="number" min="0" max="30" data-k="matchesPerMonth" value="${a.matchesPerMonth}" /></div>
          <div class="field"><label>Minuter per match</label><input type="number" min="10" max="120" data-k="minPerMatch" value="${a.minPerMatch}" /></div>
        </div>
      </section>

      <section class="card">
        <h2>På raster i skolan</h2>
        <div class="grid-2">
          <div class="field"><label>Skoldagar/vecka (med boll)</label><input type="number" min="0" max="7" data-k="schoolDaysPerWeek" value="${a.schoolDaysPerWeek}" /></div>
          <div class="field"><label>Minuter per dag</label><input type="number" min="0" max="180" data-k="minPerBreak" value="${a.minPerBreak}" /></div>
        </div>
      </section>

      <section class="card">
        <h2>Hemma / med kompisar</h2>
        <div class="grid-2">
          <div class="field"><label>Dagar/vecka</label><input type="number" min="0" max="7" data-k="homeDaysPerWeek" value="${a.homeDaysPerWeek}" /></div>
          <div class="field"><label>Minuter per gång</label><input type="number" min="0" max="240" data-k="minPerHomeSession" value="${a.minPerHomeSession}" /></div>
        </div>
      </section>

      <section class="card">
        <h2>Säsongsjustering</h2>
        <label>Andel av året du tränat (0.5 = halvår, 1.0 = hela året)</label>
        <input type="number" step="0.05" min="0.3" max="1" data-k="seasonFactor" value="${a.seasonFactor}" />
      </section>

      <section class="card">
        <h2>Uppskattning</h2>
        <div class="big-number">${formatHours(e.hours)} h</div>
        <div class="muted small">
          Organiserat: ${formatHours(e.breakdown.organized)} h ·
          Match: ${formatHours(e.breakdown.match)} h ·
          Raster: ${formatHours(e.breakdown.breaks)} h ·
          Hemma: ${formatHours(e.breakdown.home)} h
        </div>
      </section>

      <section class="card">
        <div class="row" style="gap:8px;">
          <button class="ghost" id="skip">Hoppa över</button>
          <button class="primary" id="save" style="flex:1;">Spara och börja</button>
        </div>
      </section>
    `;

    root.querySelectorAll<HTMLInputElement>('input[data-k]').forEach((inp) => {
      inp.addEventListener('input', () => {
        const k = inp.dataset.k as keyof PriorEstimateAnswers;
        const v = Number(inp.value);
        if (!Number.isFinite(v)) return;
        a = { ...a, [k]: v };
        const est = computeEstimate(a);
        const bigEl = root.querySelector('.big-number');
        if (bigEl) bigEl.textContent = `${formatHours(est.hours)} h`;
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
  };

  draw();
}
