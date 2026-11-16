// Dashboard UI View - Club Overview, Status & Quick Navigation
import { gameState } from '../gameState.js';
import { RaceSimulation } from '../engine/simulation.js';

export function renderDashboard() {
  const { leagueEngine, difficulty } = gameState;
  const club = leagueEngine.playerClub;
  const currentSchedule = leagueEngine.getCurrentScheduleEvent();

  const divisionClubs = [...(leagueEngine.divisions[club.division] || [])].sort(
    (a, b) => b.prelimLeaguePoints - a.prelimLeaguePoints || b.prelimTotalPoints - a.prelimTotalPoints
  );
  const clubRank = divisionClubs.findIndex(c => c.id === club.id) + 1;

  const totalWeeklySalaries = club.calculateWeeklySalaries();
  const facilityMaintenance = club.calculateFacilityMaintenance();
  const totalWeeklyExpenses = totalWeeklySalaries + facilityMaintenance;

  // Find top star swimmer
  const starSwimmer = [...club.swimmers].sort((a, b) => b.peakRating - a.peakRating)[0];

  // Swimmers with high fatigue
  const fatiguedSwimmers = club.swimmers.filter(s => (s.chronicFatigue + s.acuteFatigue) / 2 > 55);

  return `
    <div class="space-y-6">
      <!-- Top Banner: Club Overview & Season Calendar -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Club Card -->
        <div class="glass-card p-5 rounded-2xl flex flex-col justify-between border-l-4" style="border-left-color: ${club.primaryColor};">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs uppercase tracking-wider text-slate-400 font-semibold">${club.division}</span>
              <span class="badge ${clubRank <= 2 ? 'badge-success' : clubRank >= divisionClubs.length - 1 ? 'badge-danger' : 'badge-primary'}">
                Posto #${clubRank}
              </span>
            </div>
            <h2 class="text-2xl font-bold text-white tracking-tight">${club.name}</h2>
            <p class="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>📍</span> ${club.city} · <span>Reputación:</span> ${club.reputation}/100
            </p>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
            <span>Plantilla: <strong>${club.swimmers.length} nadadores</strong></span>
            <span>Equipamento: <strong>${club.equipment.length} melloras</strong></span>
          </div>
        </div>

        <!-- Economy Card -->
        <div class="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <span class="text-xs uppercase tracking-wider text-slate-400 font-semibold">Finanzas do Club</span>
            <div class="text-3xl font-extrabold text-emerald-400 mt-1">
              ${club.funds.toLocaleString()} €
            </div>
            <p class="text-xs text-slate-400 mt-1">
              Gastos semanais: <span class="text-rose-400 font-semibold">-${totalWeeklyExpenses.toLocaleString()} €/sem</span>
            </p>
          </div>
          <div class="mt-3 pt-3 border-t border-slate-700/60 text-xs flex justify-between text-slate-300">
            <span>Salarios: -${totalWeeklySalaries} €</span>
            <span>Mantemento: -${facilityMaintenance} €</span>
          </div>
        </div>

        <!-- Calendar / Week Status -->
        <div class="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs uppercase tracking-wider text-cyan-400 font-semibold">Semana ${leagueEngine.currentWeek} de ${leagueEngine.totalWeeks}</span>
              <span class="badge badge-warning text-xs">${currentSchedule.month}</span>
            </div>
            <h3 class="text-lg font-bold text-white mt-1 leading-snug">${currentSchedule.name}</h3>
            <p class="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
              <span>${currentSchedule.phase.icon || '🏊'}</span>
              <span>${currentSchedule.phase.name}</span>
            </p>
            ${currentSchedule.isCustomPhase ? '<span class="text-[10px] text-emerald-400 font-semibold block mt-0.5">★ Carga contemporizada polo adestrador</span>' : ''}
          </div>
          <div class="mt-3 pt-2 space-y-1.5">
            <button id="btn-advance-week" class="btn btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
              <span>⏩</span> Avanzar Semana (Adestrar)
            </button>
            <button id="btn-goto-training-dashboard" class="btn btn-outline w-full py-1.5 text-xs text-cyan-300 hover:text-white flex items-center justify-center gap-1">
              <span>⚙️</span> Axustar Cargas & Descargas
            </button>
          </div>
        </div>

        <!-- Next Major Event Alert -->
        <div class="glass-card p-5 rounded-2xl flex flex-col justify-between border-r-4 border-amber-500">
          <div>
            <span class="text-xs uppercase tracking-wider text-amber-400 font-semibold">Próximo Obxectivo</span>
            <div class="mt-1">
              ${getNextEventBadge(leagueEngine)}
            </div>
          </div>
          <div class="mt-3">
            <button id="btn-quick-roster" class="btn btn-secondary w-full py-2 text-xs font-semibold">
              📋 Abrir Convocatoria
            </button>
          </div>
        </div>
      </div>

      <!-- Action Banner & Alerts -->
      ${fatiguedSwimmers.length > 0 ? `
        <div class="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-sm flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-xl">⚠️</span>
            <span><strong>Aviso do Equipo Técnico:</strong> Tes <strong>${fatiguedSwimmers.length} nadadores</strong> con alta fatiga acumulada. Considera reducir o volume ou asignar recuperación no plan de periodización.</span>
          </div>
          <button id="btn-goto-training" class="btn btn-sm btn-outline border-amber-400 text-amber-300 hover:bg-amber-400/20 whitespace-nowrap ml-4">
            Axustar Adestramento
          </button>
        </div>
      ` : ''}

      <!-- Center Grid: Mini Table & Star Swimmer Showcase -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Division Standings Card -->
        <div class="glass-card p-5 rounded-2xl lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <span>🏆</span> Clasificación ${club.division}
            </h3>
            <button id="btn-full-standings" class="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
              Ver todas as divisións →
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="text-xs text-slate-400 border-b border-slate-700/60 pb-2">
                  <th class="py-2 px-3">#</th>
                  <th class="py-2 px-3">Club</th>
                  <th class="py-2 px-3 text-center">Pts Xornada</th>
                  <th class="py-2 px-3 text-center">Pts Probas</th>
                  <th class="py-2 px-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/80">
                ${divisionClubs.map((c, i) => {
                  const isPlayer = c.id === club.id;
                  let zoneBadge = '';
                  if (i <= 1) zoneBadge = '<span class="text-emerald-400 text-xs font-semibold">Ascenso</span>';
                  else if (i >= divisionClubs.length - 2) zoneBadge = '<span class="text-rose-400 text-xs font-semibold">Descenso</span>';
                  else zoneBadge = '<span class="text-slate-500 text-xs">Permanencia</span>';

                  return `
                    <tr class="${isPlayer ? 'bg-cyan-950/30 font-semibold text-cyan-200' : 'text-slate-300 hover:bg-slate-800/30'}">
                      <td class="py-2.5 px-3 font-mono ${i <= 1 ? 'text-emerald-400' : ''}">${i + 1}</td>
                      <td class="py-2.5 px-3 flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full inline-block" style="background-color: ${c.primaryColor};"></span>
                        <span>${c.name}</span>
                        ${isPlayer ? '<span class="badge badge-primary text-[10px] ml-1">Ti</span>' : ''}
                      </td>
                      <td class="py-2.5 px-3 text-center font-bold text-white">${c.prelimLeaguePoints}</td>
                      <td class="py-2.5 px-3 text-center text-slate-400">${c.prelimTotalPoints}</td>
                      <td class="py-2.5 px-3 text-right">${zoneBadge}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Star Swimmer & Roster Summary -->
        <div class="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span>⭐</span> Nadador Destacado
            </h3>
            ${starSwimmer ? `
              <div class="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="font-bold text-white text-base">${starSwimmer.fullName}</h4>
                    <p class="text-xs text-slate-400">${starSwimmer.age} anos · ${starSwimmer.gender === 'M' ? 'Masculino' : 'Feminino'} · ${starSwimmer.specialty.toUpperCase()}</p>
                  </div>
                  <div class="text-right">
                    <span class="text-xs text-slate-400">Media</span>
                    <div class="text-xl font-extrabold text-cyan-400">${starSwimmer.overallRating}</div>
                  </div>
                </div>

                <!-- Mini stat bars -->
                <div class="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div>
                    <div class="flex justify-between text-slate-400 mb-0.5">
                      <span>Velocidade</span>
                      <span class="text-slate-200 font-bold">${starSwimmer.stats.speed}</span>
                    </div>
                    <div class="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div class="bg-cyan-400 h-full rounded-full" style="width: ${starSwimmer.stats.speed}%"></div>
                    </div>
                  </div>
                  <div>
                    <div class="flex justify-between text-slate-400 mb-0.5">
                      <span>Fondo</span>
                      <span class="text-slate-200 font-bold">${starSwimmer.stats.distance}</span>
                    </div>
                    <div class="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div class="bg-emerald-400 h-full rounded-full" style="width: ${starSwimmer.stats.distance}%"></div>
                    </div>
                  </div>
                  <div>
                    <div class="flex justify-between text-slate-400 mb-0.5">
                      <span>Forza</span>
                      <span class="text-slate-200 font-bold">${starSwimmer.stats.strength}</span>
                    </div>
                    <div class="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div class="bg-amber-400 h-full rounded-full" style="width: ${starSwimmer.stats.strength}%"></div>
                    </div>
                  </div>
                  <div>
                    <div class="flex justify-between text-slate-400 mb-0.5">
                      <span>${starSwimmer.primaryStroke.toUpperCase()}</span>
                      <span class="text-slate-200 font-bold">${starSwimmer.stats[starSwimmer.primaryStroke] || 50}</span>
                    </div>
                    <div class="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div class="bg-purple-400 h-full rounded-full" style="width: ${starSwimmer.stats[starSwimmer.primaryStroke] || 50}%"></div>
                    </div>
                  </div>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-700/60 flex justify-between items-center text-xs">
                  <span class="text-slate-400">Puntos tempada: <strong class="text-white">${starSwimmer.seasonPoints}</strong></span>
                  <span class="badge ${starSwimmer.form > 80 ? 'badge-success' : 'badge-warning'}">Forma: ${starSwimmer.form}</span>
                </div>
              </div>
            ` : '<p class="text-xs text-slate-400">Non hai nadadores dispoñibles</p>'}
          </div>

          <div class="mt-4">
            <button id="btn-goto-swimmers" class="btn btn-outline w-full py-2 text-xs">
              Ver Todos os Nadadores (${club.swimmers.length}) →
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getNextEventBadge(engine) {
  const futureMeet = engine.schedule.find(s => s.week >= engine.currentWeek && (s.type === 'meet' || s.type === 'final_meet'));
  if (!futureMeet) return '<span class="text-slate-400">Fin da tempada</span>';

  const weeksLeft = futureMeet.week - engine.currentWeek;
  if (weeksLeft === 0) {
    return `
      <div class="text-base font-bold text-emerald-400 flex items-center gap-1">
        <span>🏊‍♂️</span> ¡ESTA SEMANA É A COMPETICIÓN!
      </div>
      <p class="text-xs text-slate-300 mt-0.5">${futureMeet.name}</p>
    `;
  }
  return `
    <div class="text-sm font-semibold text-white">${futureMeet.name}</div>
    <div class="text-xs text-amber-300 font-medium mt-0.5">Faltan ${weeksLeft} semana(s) · Semana ${futureMeet.week}</div>
  `;
}
