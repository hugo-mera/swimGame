// Main Application Controller & Router
import { gameState } from './gameState.js';
import { renderDashboard } from './ui/dashboardView.js';
import { renderSwimmers, setupSwimmersEvents } from './ui/swimmerView.js';
import { renderTraining, setupTrainingEvents } from './ui/trainingView.js';
import { renderMarket, setupMarketEvents } from './ui/marketView.js';
import { renderFacilities, setupFacilitiesEvents } from './ui/facilitiesView.js';
import { renderStandings, setupStandingsEvents } from './ui/standingsView.js';
import { renderMeet, setupMeetEvents, stopMeetAnimation } from './ui/meetView.js';
import { renderNewGameModal, setupNewGameEvents } from './ui/newGameModal.js';
import { soundManager } from './audio/soundFx.js';
import { getMeetRegistrationKey } from './engine/league.js';

function initApp() {
  // Check if save exists in localStorage
  const hasLoaded = gameState.loadFromLocalStorage();

  // Expose UI refresher
  window.__refreshGameUI = renderApp;
  window.__refreshNotifications = renderNotifications;

  // Initial render
  renderApp();
}

function renderApp(animateTabContent = false) {
  const root = document.getElementById('app');
  if (!root) return;
  stopMeetAnimation();

  // If game not started yet, render New Game Modal
  if (!gameState.isGameStarted) {
    root.innerHTML = renderNewGameModal();
    setupNewGameEvents(root);
    return;
  }

  const { leagueEngine, activeTab } = gameState;
  const club = leagueEngine.playerClub;
  const scheduleEvent = leagueEngine.getCurrentScheduleEvent();

  // App Layout: Top Navigation Bar + Main Content Container + Toast Container
  root.innerHTML = `
    <div class="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <!-- Top Navigation Bar -->
      <header class="glass-card sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <!-- Club Brand -->
          <div class="flex items-center gap-3">
            <span class="w-4 h-4 rounded-full shadow" style="background-color: ${club.primaryColor};"></span>
            <div>
              <h1 class="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                <span>${club.name}</span>
                <span class="badge badge-primary text-[10px]">${club.division}</span>
              </h1>
              <span class="text-[11px] text-slate-400 font-medium">Liga Galega de Clubs · Tempada ${leagueEngine.currentSeasonYear}</span>
            </div>
          </div>

          <!-- Tab Navigation Links -->
          <nav class="hidden md:flex items-center gap-1">
            ${renderNavTab('dashboard', '📊 Panel', activeTab)}
            ${renderNavTab('swimmers', '👥 Plantilla', activeTab)}
            ${renderNavTab('training', '🏊‍♂️ Adestramento', activeTab)}
            ${renderNavTab('market', '🛒 Mercado', activeTab)}
            ${renderNavTab('facilities', '🏋️ Instalacións', activeTab)}
            ${renderNavTab('standings', '🏆 Liga', activeTab)}
            ${renderNavTab('meet', '🏁 Competición', activeTab, true)}
          </nav>

          <!-- Top Right Info & Save Utility -->
          <div class="flex items-center gap-3">
            <div class="hidden sm:block text-right">
              <span class="text-[10px] text-slate-400 font-semibold block uppercase">Semana ${leagueEngine.currentWeek}/36</span>
              <span class="text-xs font-mono font-bold ${club.funds < 0 ? 'text-rose-400 font-black' : 'text-emerald-400'}">${club.funds.toLocaleString()} €</span>
            </div>

            <!-- Save / Load Dropdown or buttons -->
            <button id="btn-export-save" class="btn btn-xs btn-outline" title="Descargar arquivo de gardado">
              💾 Gardar
            </button>
            <label class="btn btn-xs btn-outline cursor-pointer" title="Cargar arquivo de gardado">
              📂 Cargar
              <input type="file" id="input-import-save" accept=".json" class="hidden">
            </label>
            <button id="btn-reset-game" class="btn btn-xs btn-outline text-slate-500 hover:text-rose-400" title="Reiniciar partida">
              🔄
            </button>
          </div>
        </div>

        <!-- Mobile Nav Bar -->
        <div class="md:hidden flex items-center justify-around border-t border-slate-800/80 py-1.5 px-2 bg-slate-900/90 text-xs overflow-x-auto">
          ${renderNavTab('dashboard', '📊 Panel', activeTab)}
          ${renderNavTab('swimmers', '👥 Plantilla', activeTab)}
          ${renderNavTab('training', '🏊 Adestr.', activeTab)}
          ${renderNavTab('market', '🛒 Mercado', activeTab)}
          ${renderNavTab('standings', '🏆 Liga', activeTab)}
          ${renderNavTab('meet', '🏁 Carreira', activeTab, true)}
        </div>
      </header>

      <!-- Main Body Container -->
      <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="${animateTabContent ? 'animate-in' : ''}">
          ${renderActiveTabContent()}
        </div>
      </main>

      <!-- Toast Container -->
      <div id="toast-container">
        ${renderToastNotifications()}
      </div>
    </div>
  `;

  // Attach event handlers
  setupMainEvents(root);
}

function renderToastNotifications() {
  return gameState.notifications.map(n => `
    <div class="toast toast-${n.type}" data-notification-id="${n.id}">
      <span>${n.type === 'success' ? '✅' : n.type === 'error' ? '❌' : 'ℹ️'}</span>
      <span>${n.message}</span>
    </div>
  `).join('');
}

function renderNotifications() {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const existing = new Map(
    [...container.querySelectorAll('.toast')].map(toast => [
      toast.dataset.notificationId,
      toast
    ])
  );
  const activeIds = new Set();

  gameState.notifications.forEach(notification => {
    const id = String(notification.id);
    activeIds.add(id);
    if (existing.has(id)) {
      existing.delete(id);
      return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${notification.type}`;
    toast.dataset.notificationId = id;
    toast.innerHTML = `
      <span>${notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}</span>
      <span>${notification.message}</span>
    `;
    container.appendChild(toast);
  });

  existing.forEach(toast => toast.remove());
}

function renderNavTab(tabId, label, activeTab, isHighlight = false) {
  const isActive = activeTab === tabId;
  let btnClass = isActive
    ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20'
    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 font-semibold';

  if (isHighlight && !isActive) {
    btnClass = 'text-amber-300 hover:bg-amber-950/40 font-bold border border-amber-500/30';
  }

  return `
    <button class="nav-tab-btn px-3 py-1.5 rounded-lg text-xs transition-colors ${btnClass}" data-tab="${tabId}">
      ${label}
    </button>
  `;
}

function renderActiveTabContent() {
  switch (gameState.activeTab) {
    case 'dashboard': return renderDashboard();
    case 'swimmers': return renderSwimmers();
    case 'training': return renderTraining();
    case 'market': return renderMarket();
    case 'facilities': return renderFacilities();
    case 'standings': return renderStandings();
    case 'meet': return renderMeet();
    default: return renderDashboard();
  }
}

function setupMainEvents(root) {
  // Navigation tabs
  root.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.onclick = () => {
      gameState.activeTab = btn.getAttribute('data-tab');
      renderApp(true);
    };
  });

  // Export save
  const exportBtn = root.querySelector('#btn-export-save');
  if (exportBtn) {
    exportBtn.onclick = () => gameState.exportSaveFile();
  }

  // Import save
  const importInput = root.querySelector('#input-import-save');
  if (importInput) {
    importInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          gameState.importSaveFile(ev.target.result);
        };
        reader.readAsText(file);
      }
    };
  }

  // Reset game
  const resetBtn = root.querySelector('#btn-reset-game');
  if (resetBtn) {
    resetBtn.onclick = () => {
      if (confirm('¿Seguro que desexas reiniciar e comezar unha nova tempada?')) {
        localStorage.removeItem('swimGameSaveData_v1');
        gameState.isGameStarted = false;
        renderApp();
      }
    };
  }

  // Advance week button from dashboard
  const advanceBtn = root.querySelector('#btn-advance-week');
  if (advanceBtn) {
    advanceBtn.onclick = () => {
      const currentEv = gameState.leagueEngine.getCurrentScheduleEvent();
      const isRaceWeek = currentEv.type === 'meet' || currentEv.type === 'final_meet';
      const registrationKey = getMeetRegistrationKey(currentEv, gameState.leagueEngine.phase);
      if (currentEv.type === 'roster_deadline' &&
          gameState.leagueEngine.playerClub.meetEntriesSubmittedFor !== registrationKey) {
        gameState.notify('Debes validar e pechar a inscrición esta semana antes de avanzar.', 'error');
        gameState.activeTab = 'meet';
        renderApp();
        return;
      }
      if (isRaceWeek) {
        gameState.notify('¡É semana de competición oficial! Debes disputar as carreiras na pestana de Competición.', 'error');
        gameState.activeTab = 'meet';
        renderApp();
        return;
      }
      const res = gameState.leagueEngine.advanceWeek();
      gameState.notify(`Semana ${res.completedWeek} completada! Atributos e fatiga actualizados (mira os indicadores ▲/▼ na Plantilla).`, 'info');
      gameState.saveToLocalStorage();
      renderApp();
    };
  }

  // Mandatory meet button
  const mandatoryMeetBtn = root.querySelector('#btn-mandatory-meet');
  if (mandatoryMeetBtn) {
    mandatoryMeetBtn.onclick = () => {
      gameState.activeTab = 'meet';
      renderApp();
    };
  }

  // Quick action buttons
  const quickRosterBtn = root.querySelector('#btn-quick-roster');
  if (quickRosterBtn) {
    quickRosterBtn.onclick = () => {
      gameState.activeTab = 'meet';
      renderApp();
    };
  }

  const gotoTrainingBtn = root.querySelector('#btn-goto-training');
  if (gotoTrainingBtn) {
    gotoTrainingBtn.onclick = () => {
      gameState.activeTab = 'training';
      renderApp();
    };
  }

  const gotoTrainingDashboardBtn = root.querySelector('#btn-goto-training-dashboard');
  if (gotoTrainingDashboardBtn) {
    gotoTrainingDashboardBtn.onclick = () => {
      gameState.activeTab = 'training';
      renderApp();
    };
  }

  const gotoSwimmersBtn = root.querySelector('#btn-goto-swimmers');
  if (gotoSwimmersBtn) {
    gotoSwimmersBtn.onclick = () => {
      gameState.activeTab = 'swimmers';
      renderApp();
    };
  }

  const fullStandingsBtn = root.querySelector('#btn-full-standings');
  if (fullStandingsBtn) {
    fullStandingsBtn.onclick = () => {
      gameState.activeTab = 'standings';
      renderApp();
    };
  }

  // Tab-specific event setups
  switch (gameState.activeTab) {
    case 'swimmers': setupSwimmersEvents(root); break;
    case 'training': setupTrainingEvents(root); break;
    case 'market': setupMarketEvents(root); break;
    case 'facilities': setupFacilitiesEvents(root); break;
    case 'standings': setupStandingsEvents(root); break;
    case 'meet': setupMeetEvents(root); break;
  }
}

// Start app safely whether DOM is already loaded or still loading
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
