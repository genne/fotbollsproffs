import { getState, setState, uid } from '../state';
import type { PlanEntry, Weekday } from '../types';
import { WEEKDAY_NAMES } from '../types';
import { computeForecast } from '../forecast';

export function renderPlan(root: HTMLElement): void {
  const state = getState();
  const f = computeForecast(state);
  const days: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

  root.innerHTML = `
    <section class="card">
      <h1>Träningsplan</h1>
      <p>Lägg in dina ordinarie pass och extraträningar. Vi räknar om ETA när planen ändras.</p>
      <div class="stat"><span class="muted">Timmar i plan</span><span>${f.hoursPerWeekPlan.toFixed(1)} h/v</span></div>
      <div class="stat"><span class="muted">Senaste 4 veckor</span><span>${f.hoursPerWeekRecent.toFixed(1)} h/v</span></div>
      <div class="row" style="margin-top:8px; gap:8px;">
        <span class="chip ${state.forecastSource === 'plan' ? 'active' : ''}" data-src="plan">Prognos från plan</span>
        <span class="chip ${state.forecastSource === 'recent' ? 'active' : ''}" data-src="recent">Prognos från logg</span>
      </div>
    </section>

    ${days.map((d) => {
      const entries = state.plan.filter((p) => p.weekday === d);
      return `
        <div class="plan-day">
          <h3>${WEEKDAY_NAMES[d]}</h3>
          ${entries.length === 0 ? '<div class="muted small">Inga pass</div>' :
            entries.map((e) => `
              <div class="plan-entry">
                <div>
                  <strong>${e.startTime}</strong> · ${e.durationMin} min
                  ${e.label ? ` · ${e.label}` : ''}
                  <span class="kind ${e.kind}">${e.kind === 'extra' ? ' (extra)' : ''}</span>
                </div>
                <button class="ghost small" data-del="${e.id}">✕</button>
              </div>
            `).join('')}
        </div>
      `;
    }).join('')}

    <section class="card">
      <h2>Lägg till pass</h2>
      <div class="field">
        <label>Dag</label>
        <select id="weekday">
          ${days.map((d) => `<option value="${d}">${WEEKDAY_NAMES[d]}</option>`).join('')}
        </select>
      </div>
      <div class="grid-2">
        <div class="field">
          <label>Starttid</label>
          <input id="time" type="time" value="17:30" />
        </div>
        <div class="field">
          <label>Längd (min)</label>
          <input id="dur" type="number" min="10" max="360" value="90" />
        </div>
      </div>
      <div class="field">
        <label>Typ</label>
        <select id="kind">
          <option value="ordinarie">Ordinarie</option>
          <option value="extra">Extra</option>
        </select>
      </div>
      <div class="field">
        <label>Etikett (valfri)</label>
        <input id="label" placeholder="T.ex. Lagträning, Skottpass..." />
      </div>
      <button class="primary" id="add">Lägg till</button>
    </section>
  `;

  root.querySelectorAll<HTMLSpanElement>('.chip[data-src]').forEach((chip) => {
    chip.addEventListener('click', () => {
      setState((s) => ({ ...s, forecastSource: chip.dataset.src as 'plan' | 'recent' }));
      renderPlan(root);
    });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-del]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.del!;
      setState((s) => ({ ...s, plan: s.plan.filter((p) => p.id !== id) }));
      renderPlan(root);
    });
  });

  root.querySelector<HTMLButtonElement>('#add')?.addEventListener('click', () => {
    const weekday = Number(root.querySelector<HTMLSelectElement>('#weekday')!.value) as Weekday;
    const startTime = root.querySelector<HTMLInputElement>('#time')!.value;
    const durationMin = Number(root.querySelector<HTMLInputElement>('#dur')!.value);
    const kind = root.querySelector<HTMLSelectElement>('#kind')!.value as 'ordinarie' | 'extra';
    const label = root.querySelector<HTMLInputElement>('#label')!.value.trim() || undefined;
    if (!startTime || !durationMin) return;
    const entry: PlanEntry = { id: uid(), weekday, startTime, durationMin, kind, label };
    setState((s) => ({ ...s, plan: [...s.plan, entry] }));
    renderPlan(root);
  });
}
