import { getState, setState } from '../state';
import { CATEGORIES } from '../types';

export function renderLog(root: HTMLElement): void {
  const state = getState();
  root.innerHTML = `
    <section class="card">
      <h1>Träningslogg</h1>
      <p>Alla loggade sessioner. Du kan redigera eller ta bort.</p>
    </section>
    ${state.sessions.length === 0
      ? '<div class="card"><p>Inga sessioner än.</p></div>'
      : state.sessions.map((s) => `
        <div class="card" data-id="${s.id}">
          <div class="row between">
            <strong>${new Date(s.startedAt).toLocaleString('sv-SE')}</strong>
            <span>${s.minutes} min</span>
          </div>
          <div class="field" style="margin-top:8px;">
            <label>Kategori</label>
            <select data-field="category">
              <option value="">—</option>
              ${CATEGORIES.map((c) => `<option value="${c}" ${s.category === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Anteckning</label>
            <input data-field="note" value="${(s.note ?? '').replace(/"/g, '&quot;')}" />
          </div>
          <div class="row" style="justify-content:flex-end; gap:8px;">
            <button class="ghost" data-action="save">Spara</button>
            <button class="danger" data-action="delete">Ta bort</button>
          </div>
        </div>
      `).join('')}
  `;

  root.querySelectorAll<HTMLElement>('[data-id]').forEach((el) => {
    const id = el.dataset.id!;
    el.querySelector<HTMLButtonElement>('[data-action="save"]')?.addEventListener('click', () => {
      const category = el.querySelector<HTMLSelectElement>('[data-field="category"]')!.value;
      const note = el.querySelector<HTMLInputElement>('[data-field="note"]')!.value;
      setState((s) => ({
        ...s,
        sessions: s.sessions.map((x) =>
          x.id === id
            ? { ...x, category: (category || undefined) as typeof x.category, note: note.trim() || undefined }
            : x,
        ),
      }));
    });
    el.querySelector<HTMLButtonElement>('[data-action="delete"]')?.addEventListener('click', () => {
      if (!confirm('Ta bort denna session?')) return;
      setState((s) => ({ ...s, sessions: s.sessions.filter((x) => x.id !== id) }));
      renderLog(root);
    });
  });
}
