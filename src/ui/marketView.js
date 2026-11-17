// Swimmers Market UI View - Buy & Sell Athletes
import { gameState } from '../gameState.js';
import { STROKE_LABELS, STAT_LABELS, STAT_KEYS } from '../constants.js';

let marketFilterGender = 'ALL';
let marketFilterStroke = 'ALL';

export function renderMarket() {
  const { leagueEngine, difficulty } = gameState;
  const club = leagueEngine.playerClub;

  if (!leagueEngine.isMarketOpen()) {
    return `
      <section class="market-closed glass-card">
        <span class="market-closed-icon" aria-hidden="true">🗓️</span>
        <p class="eyebrow">Mercado de fichaxes</p>
        <h2>O mercado abre en setembro</h2>
        <p>As fichaxes e a renovación de oxeadores só están dispoñibles durante o primeiro mes da tempada.</p>
        <span class="badge badge-warning">Pechado · ${leagueEngine.getCurrentScheduleEvent().month}</span>
      </section>
    `;
  }

  let pool = [...leagueEngine.marketSwimmers];
  if (marketFilterGender !== 'ALL') {
    pool = pool.filter(s => s.gender === marketFilterGender);
  }
  if (marketFilterStroke !== 'ALL') {
    pool = pool.filter(s => s.primaryStroke === marketFilterStroke);
  }

  // Sort by peak rating desc
  pool.sort((a, b) => b.peakRating - a.peakRating);

  return `
    <div class="space-y-6">
      <!-- Top Market Header & Wallet -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-5 rounded-2xl">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-xl font-bold text-white">Mercado de Nadadores Libres</h2>
            <span class="badge badge-primary text-xs">Semana ${leagueEngine.currentWeek}</span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">Explora e ficha novos talentos da natación galega para ascender de división</p>
        </div>

        <div class="flex items-center gap-4">
          <div class="text-right">
            <span class="text-xs text-slate-400 block font-semibold uppercase">Orzamento Dispoñible</span>
            <div class="text-2xl font-black ${club.funds < 0 ? 'text-rose-500' : 'text-emerald-400'} font-mono">${club.funds.toLocaleString()} €</div>
          </div>
          <button id="btn-refresh-market-now" class="btn btn-sm btn-outline text-xs">
            🔄 Renovar Oxeadores
          </button>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="glass-card p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2">
          <span class="text-slate-400 font-semibold">Filtrar:</span>
          <div class="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            <button class="px-2.5 py-1 rounded font-medium market-filter-gender-btn ${marketFilterGender === 'ALL' ? 'bg-cyan-600 text-white' : 'text-slate-400'}" data-gender="ALL">Todos</button>
            <button class="px-2.5 py-1 rounded font-medium market-filter-gender-btn ${marketFilterGender === 'M' ? 'bg-cyan-600 text-white' : 'text-slate-400'}" data-gender="M">Masculino</button>
            <button class="px-2.5 py-1 rounded font-medium market-filter-gender-btn ${marketFilterGender === 'F' ? 'bg-cyan-600 text-white' : 'text-slate-400'}" data-gender="F">Feminino</button>
          </div>

          <select id="select-market-stroke" class="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1">
            <option value="ALL" ${marketFilterStroke === 'ALL' ? 'selected' : ''}>Todos os Estilos</option>
            <option value="freestyle" ${marketFilterStroke === 'freestyle' ? 'selected' : ''}>Libre</option>
            <option value="backstroke" ${marketFilterStroke === 'backstroke' ? 'selected' : ''}>Costas</option>
            <option value="breaststroke" ${marketFilterStroke === 'breaststroke' ? 'selected' : ''}>Braza</option>
            <option value="butterfly" ${marketFilterStroke === 'butterfly' ? 'selected' : ''}>Bolboreta</option>
            <option value="IM" ${marketFilterStroke === 'IM' ? 'selected' : ''}>Estilos (IM)</option>
          </select>
        </div>

        <div class="text-slate-400 text-xs">
          Nadadores no teu cadro de persoal: <strong>${club.swimmers.length}</strong>
        </div>
      </div>

      <!-- Market Swimmers Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        ${pool.length > 0 ? pool.map(swimmer => {
          const marketCost = swimmer.calculateMarketValue(difficulty.marketCostMultiplier);
          const canAfford = club.funds >= marketCost;

          return `
            <div class="glass-card p-5 rounded-2xl flex flex-col justify-between border border-slate-700/60 hover:border-cyan-500/50 transition-all">
              <div>
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="font-bold text-white text-base">${swimmer.fullName}</h3>
                    <p class="text-xs text-slate-400">
                      ${swimmer.age} anos · <span class="text-cyan-300 font-semibold">${STROKE_LABELS[swimmer.primaryStroke]}</span>
                    </p>
                  </div>
                  <div class="text-right">
                    <span class="badge ${swimmer.gender === 'M' ? 'badge-primary' : 'badge-danger'} text-[10px] mb-1">${swimmer.gender === 'M' ? 'Masc' : 'Fem'}</span>
                    <div class="text-lg font-black text-cyan-400 font-mono">${swimmer.overallRating} <span class="text-[10px] text-slate-400 font-normal">med</span></div>
                  </div>
                </div>

                <!-- 8 Stats Bar Matrix -->
                <div class="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-slate-800 text-[11px]">
                  <div class="flex justify-between">
                    <span class="text-slate-400">Velocidade:</span>
                    <span class="font-bold font-mono text-cyan-300">${swimmer.stats.speed}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Fondo:</span>
                    <span class="font-bold font-mono text-emerald-300">${swimmer.stats.distance}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Forza:</span>
                    <span class="font-bold font-mono text-amber-300">${swimmer.stats.strength}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Crol:</span>
                    <span class="font-bold font-mono text-slate-200">${swimmer.stats.freestyle}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Costas:</span>
                    <span class="font-bold font-mono text-slate-200">${swimmer.stats.backstroke}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Braza:</span>
                    <span class="font-bold font-mono text-slate-200">${swimmer.stats.breaststroke}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Bolboreta:</span>
                    <span class="font-bold font-mono text-slate-200">${swimmer.stats.butterfly}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Estilos (IM):</span>
                    <span class="font-bold font-mono text-slate-200">${swimmer.stats.IM}</span>
                  </div>
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Prezo Fichaxe</span>
                  <div class="text-base font-extrabold ${canAfford ? 'text-emerald-400' : 'text-rose-400'} font-mono">
                    ${marketCost.toLocaleString()} €
                  </div>
                  <span class="text-[10px] text-slate-400">Salario: ${swimmer.salary} €/sem</span>
                </div>

                <button class="btn btn-sm ${canAfford ? 'btn-primary' : 'btn-outline opacity-50 cursor-not-allowed'} btn-sign-swimmer" data-id="${swimmer.id}" ${!canAfford ? 'disabled' : ''}>
                  Fichar ✍️
                </button>
              </div>
            </div>
          `;
        }).join('') : `
          <div class="col-span-3 text-center py-12 text-slate-400 glass-card rounded-2xl">
            Non hai nadadores no mercado cos filtros actuais.
          </div>
        `}
      </div>
    </div>
  `;
}

export function setupMarketEvents(container) {
  // Gender filters
  container.querySelectorAll('.market-filter-gender-btn').forEach(btn => {
    btn.onclick = () => {
      marketFilterGender = btn.getAttribute('data-gender');
      gameState.triggerUIUpdate();
    };
  });

  // Stroke filter
  const strokeSel = container.querySelector('#select-market-stroke');
  if (strokeSel) {
    strokeSel.onchange = (e) => {
      marketFilterStroke = e.target.value;
      gameState.triggerUIUpdate();
    };
  }

  // Refresh market
  const refreshBtn = container.querySelector('#btn-refresh-market-now');
  if (refreshBtn) {
    refreshBtn.onclick = () => {
      if (!gameState.leagueEngine.isMarketOpen()) {
        gameState.notify('O mercado só está aberto durante setembro.', 'error');
        gameState.triggerUIUpdate();
        return;
      }
      gameState.leagueEngine.refreshMarket();
      gameState.notify('Oxeadores actualizaron a lista de novos talentos dispoñibles!', 'info');
      gameState.triggerUIUpdate();
    };
  }

  // Sign swimmer
  container.querySelectorAll('.btn-sign-swimmer').forEach(btn => {
    btn.onclick = () => {
      const swimmerId = btn.getAttribute('data-id');
      const swimmer = gameState.leagueEngine.marketSwimmers.find(s => s.id === swimmerId);
      const club = gameState.leagueEngine.playerClub;
      if (!swimmer) return;
      if (!gameState.leagueEngine.isMarketOpen()) {
        gameState.notify('O mercado só está aberto durante setembro.', 'error');
        gameState.triggerUIUpdate();
        return;
      }

      const cost = swimmer.calculateMarketValue(gameState.difficulty.marketCostMultiplier);
      if (club.funds < cost) {
        gameState.notify('Fondos insuficientes para esta fichaxe.', 'error');
        return;
      }

      if (confirm(`¿Queres fichar a ${swimmer.fullName} por ${cost.toLocaleString()} €?`)) {
        club.funds -= cost;
        club.addSwimmer(swimmer);
        gameState.leagueEngine.marketSwimmers = gameState.leagueEngine.marketSwimmers.filter(s => s.id !== swimmerId);
        gameState.notify(`Fichaxe completada! ${swimmer.fullName} incorpórase ao teu club.`, 'success');
        gameState.saveToLocalStorage();
        gameState.triggerUIUpdate();
      }
    };
  });
}
