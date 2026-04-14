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

function motivate(p: number): string {
  if (p < 5) return 'Resan börjar nu!';
  if (p < 15) return 'Bra start!';
  if (p < 25) return 'Håll i det!';
  if (p < 40) return 'Du är grym!';
  if (p < 60) return 'Halvvägs mot proffs!';
  if (p < 80) return 'Nästan proffs!';
  return 'LEGENDARISK!';
}

export function renderHome(root: HTMLElement): void {
  const state = getState();
  const f = computeForecast(state);
  const active = state.activeSession;
  const pct = f.progressPct;

  root.innerHTML = `
    <div class="brand">
      <div class="brand-logo">
        <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" fill="white" opacity="0.15"/>
          <circle cx="16" cy="16" r="13" stroke="white" stroke-width="1.5" fill="none"/>
          <polygon points="16,6 19.5,12 16,14.5 12.5,12" fill="white"/>
          <polygon points="22.5,11 27,13.5 26,18.5 22.5,17" fill="white" opacity="0.85"/>
          <polygon points="9.5,11 7,18.5 6,13.5 9.5,11" fill="white" opacity="0.85"/>
          <polygon points="20,22 16,26 12,22 13,18 19,18" fill="white" opacity="0.85"/>
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
        <span class="num">${Math.round(f.totalHours).toLocaleString('sv-SE')}</span>
        <span class="unit">h</span>
      </div>
      <p class="hero-sub">Vägen mot proffs · ${state.goalHours.toLocaleString('sv-SE')}h</p>
      <div class="hero-bar-bg">
        <div class="hero-bar-fill" style="width:${pct.toFixed(1)}%;"></div>
      </div>
      <p class="hero-pct">${pct.toFixed(1)}% – ${motivate(pct)}</p>
    </div>

    <div class="timer-card" id="timer-card">
      ${active
        ? `
          <p class="ft-label">Träning pågår</p>
          <div class="live-timer" id="live-timer">${formatElapsed(active.startedAt)}</div>
          <button class="danger big" id="stop-btn">Stoppa träning</button>
          <button class="link" id="cancel-btn" style="margin-top:8px;">Avbryt utan att spara</button>
        `
        : `
          <p class="ft-label">Dags att träna?</p>
          <p class="small muted" style="margin:4px 0 12px;">Tryck när du börjar, och igen när du slutar.</p>
          <button class="primary big" id="start-btn">Starta träning</button>
        `}
    </div>

    <div class="card">
      <h2>Översikt</h2>
      <div class="stat"><span class="muted">Starttimmar (uppskattat)</span><span>${formatHours(f.priorHours)} h</span></div>
      <div class="stat"><span class="muted">Loggad träning</span><span>${formatHours(f.loggedHours)} h</span></div>
      <div class="stat"><span class="muted">Timmar kvar</span><span>${formatHours(f.remainingHours)} h</span></div>
      <div class="stat"><span class="muted">Veckotempo (${state.forecastSource === 'plan' ? 'från plan' : 'senaste 4v'})</span><span>${f.hoursPerWeekUsed.toFixed(1)} h/v</span></div>
      <div class="stat"><span class="muted">Målet nås</span><span>${f.etaDate ? formatDate(f.etaDate) : 'lägg till plan eller träning'}</span></div>
    </div>

    <div class="card">
      <h2>Senaste sessioner</h2>
      ${state.sessions.length === 0
        ? '<p class="muted small">Inga sessioner än. Starta din första träning!</p>'
        : state.sessions.slice(0, 5).map((s) => `
            <div class="session">
              <div>
                <div>${s.category ?? 'Träning'}</div>
                <div class="when">${new Date(s.startedAt).toLocaleString('sv-SE')}</div>
              </div>
              <div><strong>${s.minutes} min</strong></div>
            </div>
          `).join('')}
    </div>
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
    <p class="small muted">Valfritt – tryck Spara för att avsluta.</p>
    <div class="row wrap" style="gap:6px; margin: 10px 0;">
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
