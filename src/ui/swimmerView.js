// Swimmers Roster UI View - Detailed Attributes, Fatigue & Group Assignment
import { gameState } from '../gameState.js';
import { STAT_LABELS, STAT_KEYS, STROKE_LABELS } from '../constants.js';
import { RaceSimulation } from '../engine/simulation.js';

let activeFilterGender = 'ALL';
let activeFilterStroke = 'ALL';
let selectedSwimmerModalId = null;

function renderStatCell(val, delta = 0) {
  let indicator = '';
  if (delta > 0) {
    indicator = `<span class="text-[9px] text-emerald-400 font-bold block leading-none" title="Mellorou +${delta} puntos esta semana">▲+${delta}</span>`;
  } else if (delta < 0) {
    indicator = `<span class="text-[9px] text-rose-400 font-bold block leading-none" title="Baixou ${delta} puntos esta semana">▼${delta}</span>`;
  }
  return `
    <div class="flex flex-col items-center justify-center">
      <span class="font-bold text-slate-200 font-mono text-xs">${Math.round(val)}</span>
      ${indicator}
    </div>
  `;
}

export function renderSwimmers() {
  const { leagueEngine } = gameState;
  const club = leagueEngine.playerClub;

  let filtered = [...club.swimmers];
  if (activeFilterGender !== 'ALL') {
    filtered = filtered.filter(s => s.gender === activeFilterGender);
  }
  if (activeFilterStroke !== 'ALL') {
    filtered = filtered.filter(s => s.primaryStroke === activeFilterStroke);
  }

  // Sort by overall rating desc
  filtered.sort((a, b) => b.overallRating - a.overallRating);

  return `
    <div class="space-y-6">
      <!-- Header & Filter Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 rounded-2xl">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <span>👥</span> Plantilla do Club (${club.swimmers.length} Nadadores)
            </h2>
            <span class="badge badge-success text-[10px]">▲ Verde = Mellora</span>
            <span class="badge badge-danger text-[10px]">▼ Vermello = Empeoramento</span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">Xestiona os atributos, evolución semanal, estado de fatiga e grupo de adestramento de cada nadador</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- Gender Filter -->
          <div class="inline-flex rounded-lg bg-slate-800/80 p-0.5 border border-slate-700/60 text-xs">
            <button class="px-3 py-1.5 rounded-md font-medium filter-gender-btn ${activeFilterGender === 'ALL' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}" data-gender="ALL">Todos</button>
            <button class="px-3 py-1.5 rounded-md font-medium filter-gender-btn ${activeFilterGender === 'M' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}" data-gender="M">Masculino</button>
            <button class="px-3 py-1.5 rounded-md font-medium filter-gender-btn ${activeFilterGender === 'F' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}" data-gender="F">Feminino</button>
          </div>

          <!-- Stroke Filter -->
          <select id="select-filter-stroke" class="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500">
            <option value="ALL" ${activeFilterStroke === 'ALL' ? 'selected' : ''}>Todos os Estilos</option>
            <option value="freestyle" ${activeFilterStroke === 'freestyle' ? 'selected' : ''}>Libre</option>
            <option value="backstroke" ${activeFilterStroke === 'backstroke' ? 'selected' : ''}>Costas</option>
            <option value="breaststroke" ${activeFilterStroke === 'breaststroke' ? 'selected' : ''}>Braza</option>
            <option value="butterfly" ${activeFilterStroke === 'butterfly' ? 'selected' : ''}>Bolboreta</option>
            <option value="IM" ${activeFilterStroke === 'IM' ? 'selected' : ''}>Estilos (IM)</option>
          </select>

          <button id="btn-open-market" class="btn btn-sm btn-primary text-xs font-semibold">
            <span>🛒</span> Ir ao Mercado
          </button>
        </div>
      </div>

      <!-- Swimmers Table -->
      <div class="glass-card rounded-2xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <th class="py-3 px-3">Nadador / Idade</th>
                <th class="py-3 px-2 text-center">Xénero</th>
                <th class="py-3 px-2 text-center">Media</th>
                <th class="py-3 px-2 text-center text-cyan-300" title="Velocidade pura">Vel</th>
                <th class="py-3 px-2 text-center text-emerald-300" title="Fondo / Resistencia">Fon</th>
                <th class="py-3 px-2 text-center text-amber-300" title="Forza / Saídas / Viraxes">For</th>
                <th class="py-3 px-2 text-center" title="Técnica Crol">Cro</th>
                <th class="py-3 px-2 text-center" title="Técnica Costas">Cos</th>
                <th class="py-3 px-2 text-center" title="Técnica Braza">Bra</th>
                <th class="py-3 px-2 text-center" title="Técnica Bolboreta">Bol</th>
                <th class="py-3 px-2 text-center" title="Técnica Estilos">Est</th>
                <th class="py-3 px-3 text-center" title="Fatiga crónica e aguda">Fatiga</th>
                <th class="py-3 px-2 text-center" title="Forma / Chispa competitiva">Forma</th>
                <th class="py-3 px-3 text-center">Grupo Adestr.</th>
                <th class="py-3 px-3 text-right">Accións</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              ${filtered.length > 0 ? filtered.map(swimmer => {
                const totalFatigue = Math.round((swimmer.chronicFatigue + swimmer.acuteFatigue) / 2);
                let fatigueColor = 'text-emerald-400';
                if (totalFatigue > 60) fatigueColor = 'text-rose-400 font-bold';
                else if (totalFatigue > 35) fatigueColor = 'text-amber-400';

                const changes = swimmer.lastStatChanges || {};

                return `
                  <tr class="hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-3">
                      <div class="font-bold text-white text-sm cursor-pointer hover:text-cyan-400 transition-colors btn-view-profile" data-id="${swimmer.id}">
                        ${swimmer.fullName}
                      </div>
                      <div class="text-[11px] text-slate-400">
                        ${swimmer.age} anos · ${STROKE_LABELS[swimmer.primaryStroke] || swimmer.primaryStroke}
                      </div>
                    </td>
                    <td class="py-3 px-2 text-center">
                      <span class="badge ${swimmer.gender === 'M' ? 'badge-primary' : 'badge-danger'} text-[10px]">
                        ${swimmer.gender}
                      </span>
                    </td>
                    <td class="py-3 px-2 text-center">
                      <span class="font-extrabold text-sm text-cyan-300 font-mono">${swimmer.overallRating}</span>
                    </td>
                    <td class="py-2 px-1 text-center font-mono">${renderStatCell(swimmer.stats.speed, changes.speed)}</td>
                    <td class="py-2 px-1 text-center font-mono">${renderStatCell(swimmer.stats.distance, changes.distance)}</td>
                    <td class="py-2 px-1 text-center font-mono">${renderStatCell(swimmer.stats.strength, changes.strength)}</td>
                    <td class="py-2 px-1 text-center font-mono">${renderStatCell(swimmer.stats.freestyle, changes.freestyle)}</td>
                    <td class="py-2 px-1 text-center font-mono">${renderStatCell(swimmer.stats.backstroke, changes.backstroke)}</td>
                    <td class="py-2 px-1 text-center font-mono">${renderStatCell(swimmer.stats.breaststroke, changes.breaststroke)}</td>
                    <td class="py-2 px-1 text-center font-mono">${renderStatCell(swimmer.stats.butterfly, changes.butterfly)}</td>
                    <td class="py-2 px-1 text-center font-mono">${renderStatCell(swimmer.stats.IM, changes.IM)}</td>
                    <td class="py-3 px-3 text-center">
                      <span class="${fatigueColor} font-mono">${totalFatigue}%</span>
                    </td>
                    <td class="py-3 px-2 text-center">
                      <span class="badge ${swimmer.form >= 80 ? 'badge-success' : swimmer.form <= 50 ? 'badge-warning' : 'badge-primary'} text-[10px]">
                        ${swimmer.form}
                      </span>
                    </td>
                    <td class="py-3 px-3 text-center">
                      <select class="select-change-group bg-slate-800 text-[11px] text-slate-300 border border-slate-700 rounded px-2 py-1" data-id="${swimmer.id}">
                        <option value="group_sprint" ${swimmer.trainingGroupId === 'group_sprint' ? 'selected' : ''}>Velocistas</option>
                        <option value="group_distance" ${swimmer.trainingGroupId === 'group_distance' ? 'selected' : ''}>Fondistas</option>
                        <option value="group_strokes" ${swimmer.trainingGroupId === 'group_strokes' ? 'selected' : ''}>Estilistas</option>
                        <option value="default" ${swimmer.trainingGroupId === 'default' ? 'selected' : ''}>Xeral</option>
                      </select>
                    </td>
                    <td class="py-3 px-3 text-right whitespace-nowrap">
                      <button class="btn btn-xs btn-outline btn-view-profile mr-1" data-id="${swimmer.id}">Ficha</button>
                      <button class="btn btn-xs btn-danger btn-sell-swimmer" data-id="${swimmer.id}" title="Vender nadador por ${swimmer.calculateMarketValue(0.7)} €">Vender</button>
                    </td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="15" class="py-8 text-center text-slate-400">Non hai nadadores que coincidan cos filtros.</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Detailed Swimmer Profile Modal -->
      ${selectedSwimmerModalId ? renderSwimmerProfileModal(club.getSwimmer(selectedSwimmerModalId)) : ''}
    </div>
  `;
}

function renderSwimmerProfileModal(swimmer) {
  if (!swimmer) return '';

  const totalFatigue = Math.round((swimmer.chronicFatigue + swimmer.acuteFatigue) / 2);
  const marketVal = swimmer.calculateMarketValue(0.7);

  return `
    <div id="swimmer-modal-backdrop" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="glass-card bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in">
        <!-- Modal Header -->
        <div class="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-2xl font-bold text-white">${swimmer.fullName}</h3>
              <span class="badge ${swimmer.gender === 'M' ? 'badge-primary' : 'badge-danger'}">${swimmer.gender === 'M' ? 'Masculino' : 'Feminino'}</span>
              <span class="badge badge-warning">${swimmer.age} anos</span>
            </div>
            <p class="text-xs text-slate-400 mt-1">
              Especialista en <strong>${STROKE_LABELS[swimmer.primaryStroke]}</strong> · Perfil: <strong>${swimmer.specialty.toUpperCase()}</strong>
            </p>
          </div>
          <button id="btn-close-modal" class="text-slate-400 hover:text-white text-xl p-1">✕</button>
        </div>

        <!-- Stats Matrix & Visual Bar Display -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Atributos Principais</h4>
            <div class="space-y-2.5">
              ${STAT_KEYS.map(key => {
                const val = Math.round(swimmer.stats[key]);
                const delta = (swimmer.lastStatChanges && swimmer.lastStatChanges[key]) || 0;
                let deltaText = '';
                if (delta > 0) deltaText = `<span class="text-emerald-400 font-bold text-[11px] ml-1">▲+${delta}</span>`;
                else if (delta < 0) deltaText = `<span class="text-rose-400 font-bold text-[11px] ml-1">▼${delta}</span>`;

                let colorClass = 'bg-cyan-500';
                if (key === 'distance') colorClass = 'bg-emerald-500';
                if (key === 'strength') colorClass = 'bg-amber-500';
                if (key === swimmer.primaryStroke) colorClass = 'bg-purple-500';

                return `
                  <div>
                    <div class="flex justify-between text-xs mb-1">
                      <span class="text-slate-300 font-medium">${STAT_LABELS[key]}</span>
                      <span class="font-mono font-bold text-white">${val}/100 ${deltaText}</span>
                    </div>
                    <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div class="${colorClass} h-full rounded-full transition-all duration-300" style="width: ${val}%"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Physical Condition & Records -->
          <div class="space-y-4">
            <div class="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Estado Físico & Fatiga</h4>
              <div class="space-y-3 text-xs">
                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-slate-400">Fatiga Crónica (Acumulada)</span>
                    <span class="font-mono font-bold ${swimmer.chronicFatigue > 50 ? 'text-rose-400' : 'text-emerald-400'}">${swimmer.chronicFatigue}%</span>
                  </div>
                  <div class="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div class="bg-rose-500 h-full rounded-full" style="width: ${swimmer.chronicFatigue}%"></div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-slate-400">Fatiga Aguda (Semanal)</span>
                    <span class="font-mono font-bold ${swimmer.acuteFatigue > 50 ? 'text-amber-400' : 'text-emerald-400'}">${swimmer.acuteFatigue}%</span>
                  </div>
                  <div class="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div class="bg-amber-500 h-full rounded-full" style="width: ${swimmer.acuteFatigue}%"></div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-slate-400">Índice de Forma / Chispa</span>
                    <span class="font-mono font-bold text-cyan-300">${swimmer.form} pts</span>
                  </div>
                  <div class="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div class="bg-cyan-400 h-full rounded-full" style="width: ${Math.min(100, swimmer.form)}%"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Best Times & Records -->
            <div class="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Mellores Marcas (PB)</h4>
              ${Object.keys(swimmer.personalBests).length > 0 ? `
                <div class="max-h-28 overflow-y-auto space-y-1 text-xs">
                  ${Object.entries(swimmer.personalBests).map(([evId, time]) => `
                    <div class="flex justify-between py-1 border-b border-slate-700/40">
                      <span class="text-slate-300">${evId}</span>
                      <span class="font-mono font-bold text-emerald-400">${RaceSimulation.formatTime(time)}</span>
                    </div>
                  `).join('')}
                </div>
              ` : '<p class="text-xs text-slate-400 italic">Sen marcas rexistradas en competición oficial aínda.</p>'}
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="border-t border-slate-800 pt-4 flex items-center justify-between">
          <div class="text-xs text-slate-400">
            Salario semanal: <strong class="text-white">${swimmer.salary} €</strong> · Valor de mercado: <strong class="text-emerald-400">${marketVal} €</strong>
          </div>
          <button id="btn-close-modal-bottom" class="btn btn-secondary px-5 py-2 text-xs">Pechar</button>
        </div>
      </div>
    </div>
  `;
}

export function setupSwimmersEvents(container) {
  // Gender filters
  container.querySelectorAll('.filter-gender-btn').forEach(btn => {
    btn.onclick = () => {
      activeFilterGender = btn.getAttribute('data-gender');
      gameState.triggerUIUpdate();
    };
  });

  // Stroke filter
  const strokeSel = container.querySelector('#select-filter-stroke');
  if (strokeSel) {
    strokeSel.onchange = (e) => {
      activeFilterStroke = e.target.value;
      gameState.triggerUIUpdate();
    };
  }

  // Open Market
  const marketBtn = container.querySelector('#btn-open-market');
  if (marketBtn) {
    marketBtn.onclick = () => {
      gameState.activeTab = 'market';
      gameState.triggerUIUpdate();
    };
  }

  // Change group
  container.querySelectorAll('.select-change-group').forEach(sel => {
    sel.onchange = (e) => {
      const swimmerId = sel.getAttribute('data-id');
      const swimmer = gameState.leagueEngine.playerClub.getSwimmer(swimmerId);
      if (swimmer) {
        swimmer.trainingGroupId = e.target.value;
        gameState.notify(`${swimmer.fullName} asignado ao novo grupo de adestramento.`, 'info');
      }
    };
  });

  // View Profile
  container.querySelectorAll('.btn-view-profile').forEach(btn => {
    btn.onclick = () => {
      selectedSwimmerModalId = btn.getAttribute('data-id');
      gameState.triggerUIUpdate();
    };
  });

  // Close modal
  const closeModal = () => {
    selectedSwimmerModalId = null;
    gameState.triggerUIUpdate();
  };
  const closeBtn1 = container.querySelector('#btn-close-modal');
  const closeBtn2 = container.querySelector('#btn-close-modal-bottom');
  if (closeBtn1) closeBtn1.onclick = closeModal;
  if (closeBtn2) closeBtn2.onclick = closeModal;

  // Sell Swimmer
  container.querySelectorAll('.btn-sell-swimmer').forEach(btn => {
    btn.onclick = () => {
      const sId = btn.getAttribute('data-id');
      const club = gameState.leagueEngine.playerClub;
      const swimmer = club.getSwimmer(sId);
      if (!swimmer) return;

      if (club.swimmers.length <= 10) {
        gameState.notify('Non podes vender máis nadadores: necesitas un mínimo de 10 nadadores para competir nas remudas e probas.', 'error');
        return;
      }

      const sellValue = swimmer.calculateMarketValue(0.7);
      if (confirm(`¿Desexas traspasar a ${swimmer.fullName} por ${sellValue.toLocaleString()} €?`)) {
        club.removeSwimmer(sId);
        club.funds += sellValue;
        gameState.notify(`Traspasado ${swimmer.fullName} por +${sellValue.toLocaleString()} €!`, 'success');
        gameState.saveToLocalStorage();
        gameState.triggerUIUpdate();
      }
    };
  });
}
