import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { subscribe } from './state';
import { renderHome } from './views/home';
import { renderLog } from './views/log';
import { renderPlan } from './views/plan';
import { renderSettings } from './views/settings';
import { renderEstimate } from './views/estimate';
import { getState } from './state';

type Tab = 'home' | 'log' | 'plan' | 'settings' | 'estimate';

const app = document.getElementById('app') as HTMLElement;
const tabs = document.getElementById('tabs') as HTMLElement;
let currentTab: Tab = 'home';

function render() {
  tabs.style.display = currentTab === 'estimate' ? 'none' : '';
  tabs.querySelectorAll('button').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === currentTab);
  });
  switch (currentTab) {
    case 'home': return renderHome(app);
    case 'log': return renderLog(app);
    case 'plan': return renderPlan(app);
    case 'settings': return renderSettings(app, go);
    case 'estimate': return renderEstimate(app, () => go('home'));
  }
}

function go(tab: Tab) {
  currentTab = tab;
  render();
  window.scrollTo({ top: 0 });
}

tabs.querySelectorAll<HTMLButtonElement>('button').forEach((btn) => {
  btn.addEventListener('click', () => go(btn.dataset.tab as Tab));
});

subscribe(() => render());

if (!getState().onboardingDone) {
  currentTab = 'estimate';
}

render();

registerSW({ immediate: true });
