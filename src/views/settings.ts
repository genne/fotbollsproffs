import { getState, replaceState, setState } from '../state';
import { exportJson, importJson, clear } from '../storage';

type Go = (tab: 'home' | 'log' | 'plan' | 'settings' | 'estimate') => void;

export function renderSettings(root: HTMLElement, go: Go): void {
  const state = getState();

  root.innerHTML = `
    <section class="card">
      <h1>Inställningar</h1>
    </section>

    <section class="card">
      <h2>Mål</h2>
      <div class="field">
        <label>Antal timmar för att bli proffs</label>
        <input type="number" id="goal" min="100" max="50000" value="${state.goalHours}" />
      </div>
      <button class="primary" id="saveGoal">Spara mål</button>
    </section>

    <section class="card">
      <h2>Starttimmar</h2>
      <p>${state.priorEstimate
        ? `Du har uppskattat ${state.priorEstimate.hours.toFixed(0)} timmar innan du började logga.`
        : 'Du har inte gjort en uppskattning än.'}</p>
      <button class="ghost" id="redo">${state.priorEstimate ? 'Gör om uppskattningen' : 'Gör uppskattning'}</button>
    </section>

    <section class="card">
      <h2>Data</h2>
      <div class="row wrap" style="gap:8px;">
        <button class="ghost" id="export">Exportera JSON</button>
        <button class="ghost" id="import">Importera JSON</button>
        <button class="danger" id="reset">Rensa all data</button>
      </div>
      <input type="file" id="fileInput" accept="application/json" style="display:none;" />
    </section>

    <section class="card">
      <div class="footer-note">Fotbollsproffs · PWA · lokal lagring</div>
    </section>
  `;

  root.querySelector<HTMLButtonElement>('#saveGoal')?.addEventListener('click', () => {
    const v = Number(root.querySelector<HTMLInputElement>('#goal')!.value);
    if (v > 0) setState((s) => ({ ...s, goalHours: v }));
  });

  root.querySelector<HTMLButtonElement>('#redo')?.addEventListener('click', () => go('estimate'));

  root.querySelector<HTMLButtonElement>('#export')?.addEventListener('click', () => {
    const blob = new Blob([exportJson(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fotbollsproffs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  const fileInput = root.querySelector<HTMLInputElement>('#fileInput')!;
  root.querySelector<HTMLButtonElement>('#import')?.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const next = importJson(text);
      if (confirm('Importera och skriva över nuvarande data?')) {
        replaceState(next);
        renderSettings(root, go);
      }
    } catch {
      alert('Ogiltig JSON-fil.');
    }
  });

  root.querySelector<HTMLButtonElement>('#reset')?.addEventListener('click', () => {
    if (!confirm('Är du säker? All data raderas.')) return;
    clear();
    location.reload();
  });
}
