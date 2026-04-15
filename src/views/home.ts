import { getState, setState, uid } from '../state';
import { computeForecast, formatDate, formatHours } from '../forecast';
import {
  cancelSession,
  formatElapsed,
  startSession,
  stopSession,
} from '../timer';
import { CATEGORIES } from '../types';
import type { Category, TrainingSession } from '../types';

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

  const paceLabel: Record<typeof f.paceSource, string> = {
    plan: 'från plan',
    recent: 'senaste 4 v',
    estimate: 'från onboarding',
    none: '—',
  };

  let etaLine = '';
  if (f.etaDate) {
    const years = (f.weeksToGoal ?? 0) / 52;
    const when = f.etaDate.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' });
    etaLine = `Du når målet <strong>${when}</strong> · om ${years.toFixed(1)} år · ${f.hoursPerWeekUsed.toFixed(1)} h/v (${paceLabel[f.paceSource]})`;
  } else {
    etaLine = 'Lägg till en plan eller logga träning för att se ETA';
  }

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
      <div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.1);">
        <p class="hero-kicker" style="margin:0 0 2px;">Prognos</p>
        <p style="color:#fff; font-size:13px; font-weight:500; margin:0; line-height:1.5;">${etaLine}</p>
      </div>
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
          <button class="link" id="manual-btn" style="margin-top:8px;">+ Logga pass jag redan gjort</button>
        `}
    </div>

    <div class="card">
      <h2>Översikt</h2>
      <div class="stat"><span class="muted">Starttimmar (uppskattat)</span><span>${formatHours(f.priorHours)} h</span></div>
      <div class="stat"><span class="muted">Loggad träning</span><span>${formatHours(f.loggedHours)} h</span></div>
      <div class="stat"><span class="muted">Timmar kvar</span><span>${formatHours(f.remainingHours)} h</span></div>
      <div class="stat"><span class="muted">Veckotempo (${paceLabel[f.paceSource]})</span><span>${f.hoursPerWeekUsed.toFixed(1)} h/v</span></div>
      <div class="stat"><span class="muted">Målet nås</span><span>${f.etaDate ? formatDate(f.etaDate) : '—'}</span></div>
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

  const manualBtn = root.querySelector<HTMLButtonElement>('#manual-btn');
  manualBtn?.addEventListener('click', () => openManualDialog(root));

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

function openManualDialog(root: HTMLElement) {
  const dlg = document.createElement('dialog');
  let chosen: Category | undefined;
  let hours = 1;
  let minutes = 0;

  dlg.innerHTML = `
    <h2>Logga ett pass</h2>
    <p class="small muted">Vad gjorde du, och hur länge?</p>

    <div style="margin:10px 0;">
      <p class="ft-label">Typ av träning</p>
      <div class="row wrap" style="gap:6px;">
        ${CATEGORIES.map((c) => `<span class="chip" data-c="${c}">${c}</span>`).join('')}
      </div>
    </div>

    <div style="margin:14px 0;">
      <p class="ft-label">Längd</p>
      <div class="duration-pickers">
        <select id="dur-h">
          ${Array.from({ length: 9 }, (_, i) => i).map((x) => `<option value="${x}" ${x === hours ? 'selected' : ''}>${x} h</option>`).join('')}
        </select>
        <select id="dur-m">
          ${[0, 15, 30, 45].map((x) => `<option value="${x}" ${x === minutes ? 'selected' : ''}>${x.toString().padStart(2, '0')} min</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="field">
      <label>Anteckning (valfri)</label>
      <textarea id="note" rows="2" placeholder="T.ex. skottövning vänsterfot"></textarea>
    </div>

    <div class="row" style="justify-content:flex-end; gap:8px;">
      <button class="ghost" id="cancel">Avbryt</button>
      <button class="primary" id="save">Spara pass</button>
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

  dlg.querySelector<HTMLSelectElement>('#dur-h')?.addEventListener('change', (e) => {
    hours = Number((e.target as HTMLSelectElement).value);
  });
  dlg.querySelector<HTMLSelectElement>('#dur-m')?.addEventListener('change', (e) => {
    minutes = Number((e.target as HTMLSelectElement).value);
  });

  dlg.querySelector<HTMLButtonElement>('#cancel')?.addEventListener('click', () => {
    dlg.close();
    dlg.remove();
  });

  dlg.querySelector<HTMLButtonElement>('#save')?.addEventListener('click', () => {
    const totalMin = hours * 60 + minutes;
    if (totalMin < 1) {
      alert('Välj en längd först.');
      return;
    }
    const note = dlg.querySelector<HTMLTextAreaElement>('#note')?.value.trim();
    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - totalMin * 60_000);
    const session: TrainingSession = {
      id: uid(),
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      minutes: totalMin,
      category: chosen,
      note: note || undefined,
    };
    setState((s) => ({ ...s, sessions: [session, ...s.sessions] }));
    dlg.close();
    dlg.remove();
    renderHome(root);
  });
}
