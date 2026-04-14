import { getState, setState } from '../state';
import { computeForecast, formatDate, formatHours } from '../forecast';
import {
  cancelSession,
  formatElapsed,
  startSession,
  stopSession,
} from '../timer';
import { CATEGORIES } from '../types';
import type { Category } from '../types';

let timerInterval: number | undefined;

export function renderHome(root: HTMLElement): void {
  const state = getState();
  const f = computeForecast(state);
  const active = state.activeSession;

  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - f.progressPct / 100);

  root.innerHTML = `
    <section class="card">
      <div class="progress-wrap">
        <div class="progress-ring">
          <svg width="220" height="220">
            <circle class="track" cx="110" cy="110" r="${radius}" fill="none" stroke-width="14" />
            <circle class="bar" cx="110" cy="110" r="${radius}" fill="none" stroke-width="14"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${offset}"
              stroke-linecap="round" />
          </svg>
        </div>
        <div style="text-align:center; margin-top:-130px; margin-bottom:70px;">
          <div class="big-number">${formatHours(f.totalHours)}</div>
          <div class="muted small">av ${state.goalHours.toLocaleString('sv-SE')} h</div>
          <div class="muted small">${f.progressPct.toFixed(1)}%</div>
        </div>
      </div>

      <div class="stat"><span class="muted">Starttimmar (uppskattat)</span><span>${formatHours(f.priorHours)} h</span></div>
      <div class="stat"><span class="muted">Loggad träning</span><span>${formatHours(f.loggedHours)} h</span></div>
      <div class="stat"><span class="muted">Timmar kvar</span><span>${formatHours(f.remainingHours)} h</span></div>
      <div class="stat"><span class="muted">Veckotempo (${state.forecastSource === 'plan' ? 'från plan' : 'senaste 4v'})</span><span>${f.hoursPerWeekUsed.toFixed(1)} h/v</span></div>
      <div class="stat"><span class="muted">Målet nås</span><span>${f.etaDate ? formatDate(f.etaDate) : 'lägg till plan eller träning'}</span></div>
    </section>

    <section class="card" id="timer-card">
      ${active
        ? `
          <h2>Träning pågår</h2>
          <div class="live-timer" id="live-timer">${formatElapsed(active.startedAt)}</div>
          <div class="row" style="justify-content:center;">
            <button class="danger big" id="stop-btn">Stoppa träning</button>
          </div>
          <button class="ghost" id="cancel-btn" style="width:100%; margin-top:8px;">Avbryt utan att spara</button>
        `
        : `
          <h2>Dags att träna?</h2>
          <p>Tryck när du börjar, och igen när du slutar.</p>
          <button class="primary big" id="start-btn">Starta träning</button>
        `}
    </section>

    <section class="card">
      <h2>Senaste sessioner</h2>
      ${state.sessions.length === 0
        ? '<p>Inga sessioner än. Starta din första träning!</p>'
        : state.sessions.slice(0, 5).map((s) => `
            <div class="session">
              <div>
                <div>${s.category ?? 'Träning'}</div>
                <div class="muted small">${new Date(s.startedAt).toLocaleString('sv-SE')}</div>
              </div>
              <div><strong>${s.minutes} min</strong></div>
            </div>
          `).join('')}
    </section>
  `;

  const startBtn = root.querySelector<HTMLButtonElement>('#start-btn');
  startBtn?.addEventListener('click', () => {
    startSession();
    renderHome(root);
  });

  const stopBtn = root.querySelector<HTMLButtonElement>('#stop-btn');
  stopBtn?.addEventListener('click', () => openStopDialog(root));

  const cancelBtn = root.querySelector<HTMLButtonElement>('#cancel-btn');
  cancelBtn?.addEventListener('click', () => {
    if (confirm('Avbryt träningen utan att spara?')) {
      cancelSession();
      renderHome(root);
    }
  });

  clearInterval(timerInterval);
  if (active) {
    const live = root.querySelector<HTMLElement>('#live-timer');
    timerInterval = window.setInterval(() => {
      if (live) live.textContent = formatElapsed(active.startedAt);
    }, 1000);
  }
}

function openStopDialog(root: HTMLElement) {
  const dlg = document.createElement('dialog');
  let chosen: Category | undefined;
  dlg.innerHTML = `
    <h2>Bra jobbat! Vad tränade du?</h2>
    <p class="small">Valfritt – tryck Spara för att avsluta.</p>
    <div class="row wrap" style="gap:6px; margin-bottom:12px;">
      ${CATEGORIES.map((c) => `<span class="chip" data-c="${c}">${c}</span>`).join('')}
    </div>
    <div class="field">
      <label>Anteckning</label>
      <textarea id="note" rows="2" placeholder="T.ex. skottövning vänsterfot"></textarea>
    </div>
    <div class="row" style="justify-content:flex-end; gap:8px;">
      <button class="ghost" id="cancel">Tillbaka</button>
      <button class="primary" id="save">Spara</button>
    </div>
  `;
  document.body.appendChild(dlg);
  dlg.showModal();

  dlg.querySelectorAll<HTMLSpanElement>('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      dlg.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      chosen = chip.dataset.c as Category;
    });
  });

  dlg.querySelector<HTMLButtonElement>('#cancel')?.addEventListener('click', () => {
    dlg.close();
    dlg.remove();
  });

  dlg.querySelector<HTMLButtonElement>('#save')?.addEventListener('click', () => {
    const note = dlg.querySelector<HTMLTextAreaElement>('#note')?.value;
    const result = stopSession(chosen, note);
    if (result.saved === false && result.reason === 'too-short') {
      if (confirm(`Sessionen var under 1 minut (${result.minutes ?? 0} min). Spara ändå?`)) {
        stopSession(chosen, note, true);
      } else {
        setState((s) => ({ ...s, activeSession: undefined }));
      }
    }
    dlg.close();
    dlg.remove();
    renderHome(root);
  });
}
