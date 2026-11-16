// Training & Periodization UI View - Interactive Load Contemporization & Group Planning
import { gameState } from '../gameState.js';
import { PERIODIZATION_PHASES } from '../constants.js';

let activeTrainingSubTab = 'CALENDAR'; // 'CALENDAR' or 'GROUPS'

export function renderTraining() {
  const { leagueEngine } = gameState;
  const club = leagueEngine.playerClub;
  const currentSchedule = leagueEngine.getCurrentScheduleEvent();
  const currentPhase = currentSchedule.phase;

  const trainingBonus = Math.round(club.getEquipmentTrainingBonus() * 100);
  const recoveryBonus = Math.round(club.getEquipmentRecoveryBonus() * 100);

  return `
    <div class="space-y-6">
      <!-- Top Periodization & Load Banner -->
      <div class="glass-card p-6 rounded-2xl space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs uppercase tracking-wider text-cyan-400 font-bold">Xestión de Cargas & Periodización</span>
              <span class="badge badge-warning text-xs">Semana ${leagueEngine.currentWeek} (${currentSchedule.month})</span>
              ${currentSchedule.isCustomPhase ? '<span class="badge badge-success text-[10px]">Carga Contemporizada polo Adestrador</span>' : ''}
            </div>
            <h2 class="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <span>${currentPhase.icon || '🏊‍♂️'}</span> ${currentPhase.name}
            </h2>
            <p class="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">${currentPhase.description}</p>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span class="badge badge-primary font-mono">Bono Material: +${trainingBonus}%</span>
            <span class="badge badge-success font-mono">Bono Crioterapia: +${recoveryBonus}%</span>
            <span class="badge ${currentPhase.badgeClass || 'badge-primary'} font-mono">${currentPhase.fatigueTrend || ''}</span>
          </div>
        </div>

        <!-- Macrocycle Visual Timeline -->
        <div class="pt-2">
          <div class="flex justify-between text-[11px] text-slate-400 font-semibold mb-1">
            <span>Set (Sem 1)</span>
            <span>Nov (Xornada A)</span>
            <span>Xan (Xornada B)</span>
            <span>Mar (Xornada C)</span>
            <span>Maio (Fase Final)</span>
          </div>
          <div class="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden flex p-0.5 border border-slate-700/60 relative">
            ${leagueEngine.schedule.map(s => {
              const weekPhase = getWeekPhase(club, s.week, s.phase);
              const isPast = s.week < leagueEngine.currentWeek;
              const isCurrent = s.week === leagueEngine.currentWeek;
              const widthPct = (1 / 36) * 100;

              return `
                <div class="h-full relative group cursor-pointer" style="width: ${widthPct}%; background-color: ${weekPhase.color || '#3b82f6'}; opacity: ${isPast ? 0.45 : isCurrent ? 1 : 0.85}; border-right: 1px solid rgba(0,0,0,0.3);" title="Semana ${s.week}: ${s.name} (${weekPhase.shortName})">
                  ${isCurrent ? '<div class="absolute inset-0 border-2 border-white animate-pulse"></div>' : ''}
                </div>
              `;
            }).join('')}
          </div>
          <div class="flex flex-wrap justify-between items-center text-[11px] text-slate-400 mt-2 gap-2">
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Base Aeróbica</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Forza & Limiar</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Velocidade / Ritmo</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> Descarga / Taper</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block"></span> Recuperación</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block"></span> Descanso Total</span>
          </div>
        </div>
      </div>

      <!-- Sub-Tabs Selector -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-2">
        <div class="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800">
          <button class="px-4 py-2 rounded-lg text-xs font-bold transition-all subtab-btn ${activeTrainingSubTab === 'CALENDAR' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}" data-subtab="CALENDAR">
            📅 Planificador de Cargas & Descargas (Semana a Semana)
          </button>
          <button class="px-4 py-2 rounded-lg text-xs font-bold transition-all subtab-btn ${activeTrainingSubTab === 'GROUPS' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}" data-subtab="GROUPS">
            🏊 Grupos de Adestramento (Volume & Intensidades)
          </button>
        </div>

        <div class="text-xs text-slate-400 hidden sm:block">
          ${activeTrainingSubTab === 'CALENDAR' ? 'Controla a carga para chegar en pico de forma ás xornadas' : 'Configura os 4 grupos especializados'}
        </div>
      </div>

      <!-- Tab Content Area -->
      ${activeTrainingSubTab === 'CALENDAR' ? renderCalendarPlanner(club, leagueEngine) : renderGroupsConfig(club)}
    </div>
  `;
}

/**
 * Sub-View 1: Calendar & Load Contemporization Planner
 */
function renderCalendarPlanner(club, leagueEngine) {
  const currentWeek = leagueEngine.currentWeek;
  const currentSchedule = leagueEngine.getCurrentScheduleEvent();
  const activePhase = currentSchedule.phase;

  return `
    <div class="space-y-6">
      <!-- Quick Load Adjuster for Current Week -->
      <div class="glass-card p-5 rounded-2xl border-l-4 border-cyan-500 bg-cyan-950/10">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span class="text-xs uppercase tracking-wider text-cyan-400 font-bold">Semana Actual: Semana ${currentWeek} (${currentSchedule.month})</span>
            <h3 class="text-lg font-bold text-white mt-0.5">¿Que tipo de carga queres aplicar nos adestramentos desta semana?</h3>
            <p class="text-xs text-slate-300 mt-1">
              Podes contemporizar a carga agora mesmo antes de premer en "Avanzar Semana" para descargar fatiga ou meter volume.
            </p>
          </div>

          <div class="flex items-center gap-3">
            <select id="select-current-week-phase" class="bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500">
              ${Object.values(PERIODIZATION_PHASES).map(p => `
                <option value="${p.id}" ${activePhase.id === p.id ? 'selected' : ''}>
                  ${p.icon} ${p.name}
                </option>
              `).join('')}
            </select>
            <button id="btn-apply-current-phase" class="btn btn-primary btn-sm px-4 py-2 font-bold whitespace-nowrap">
              Aplicar Carga
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Automation & Batch Tools -->
      <div class="glass-card p-5 rounded-2xl space-y-4">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <h4 class="font-bold text-white text-base flex items-center gap-2">
              <span>⚡</span> Ferramentas Rápidas de Contemporización
            </h4>
            <p class="text-xs text-slate-400">Automatiza as semanas de descarga (taper) antes das xornadas oficiais</p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button id="btn-auto-tapers" class="btn btn-sm btn-secondary text-xs font-semibold border-purple-500/50 hover:bg-purple-950/40 text-purple-200">
              🟣 Programar Descargas antes das 4 Xornadas
            </button>
            <button id="btn-reset-plan" class="btn btn-sm btn-outline text-xs text-slate-400">
              🔄 Restablecer Plan Estándar
            </button>
          </div>
        </div>

        <!-- Batch Range Tool -->
        <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="flex flex-wrap items-center gap-3">
            <span class="font-semibold text-slate-300">Aplicar en Bloque:</span>
            <span>Tipo:</span>
            <select id="select-batch-phase" class="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5">
              ${Object.values(PERIODIZATION_PHASES).map(p => `
                <option value="${p.id}">${p.icon} ${p.shortName}</option>
              `).join('')}
            </select>
            <span>Desde Semana:</span>
            <input type="number" id="input-batch-start" min="1" max="36" value="${Math.min(36, currentWeek + 1)}" class="bg-slate-800 border border-slate-700 text-white text-xs rounded px-2 py-1 w-16 font-mono text-center">
            <span>Ata Semana:</span>
            <input type="number" id="input-batch-end" min="1" max="36" value="${Math.min(36, currentWeek + 4)}" class="bg-slate-800 border border-slate-700 text-white text-xs rounded px-2 py-1 w-16 font-mono text-center">
          </div>
          <button id="btn-apply-batch" class="btn btn-primary btn-xs px-3.5 py-1.5 font-bold">
            Aplicar ao Rango ⚡
          </button>
        </div>
      </div>

      <!-- Full 36-Week Interactive Periodization Table -->
      <div class="glass-card rounded-2xl overflow-hidden border border-slate-700/60">
        <div class="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h4 class="font-bold text-white text-base flex items-center gap-2">
              <span>📋</span> Calendario Detallado de Semanas (Setembro - Maio)
            </h4>
            <p class="text-xs text-slate-400">Podes modificar individualmente a carga de calquera semana para afinar a preparación</p>
          </div>
          <span class="badge badge-primary text-xs">36 Semanas de Tempada</span>
        </div>

        <div class="overflow-x-auto max-h-[550px] overflow-y-auto">
          <table class="w-full text-left text-xs">
            <thead class="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th class="py-3 px-3">Semana</th>
                <th class="py-3 px-3">Mes</th>
                <th class="py-3 px-4">Evento / Competición</th>
                <th class="py-3 px-3">Tipo de Adestramento / Carga</th>
                <th class="py-3 px-3 text-center">Efecto Fatiga</th>
                <th class="py-3 px-3 text-right">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              ${leagueEngine.schedule.map(s => {
                const isPast = s.week < currentWeek;
                const isCurrent = s.week === currentWeek;
                const weekPhase = getWeekPhase(club, s.week, s.phase);
                const isCustom = club.customWeeklyPhases && club.customWeeklyPhases[s.week];
                const isMeet = s.type === 'meet' || s.type === 'final_meet';

                let rowBg = 'hover:bg-slate-800/30';
                if (isCurrent) rowBg = 'bg-cyan-950/40 font-semibold border-l-4 border-cyan-400';
                else if (isPast) rowBg = 'opacity-60 bg-slate-900/40';

                return `
                  <tr class="${rowBg} transition-colors">
                    <td class="py-3 px-3 font-mono font-bold text-white">
                      Sem ${s.week} ${isCurrent ? '<span class="text-cyan-400 ml-1">▶</span>' : ''}
                    </td>
                    <td class="py-3 px-3 text-slate-300">${s.month}</td>
                    <td class="py-3 px-4">
                      <div class="font-bold ${isMeet ? 'text-amber-400 flex items-center gap-1.5' : 'text-slate-200'}">
                        ${isMeet ? '🏊 ' + s.name : s.name}
                      </div>
                      ${isCustom ? '<span class="text-[10px] text-emerald-400 font-semibold">★ Carga axustada polo adestrador</span>' : ''}
                    </td>
                    <td class="py-3 px-3">
                      <select class="select-week-phase bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-cyan-500" data-week="${s.week}" ${isPast ? 'disabled' : ''}>
                        ${Object.values(PERIODIZATION_PHASES).map(p => `
                          <option value="${p.id}" ${weekPhase.id === p.id ? 'selected' : ''}>
                            ${p.icon} ${p.shortName}
                          </option>
                        `).join('')}
                      </select>
                    </td>
                    <td class="py-3 px-3 text-center">
                      <span class="badge ${weekPhase.badgeClass || 'badge-primary'} text-[10px]">
                        ${weekPhase.fatigueTrend || weekPhase.tag}
                      </span>
                    </td>
                    <td class="py-3 px-3 text-right">
                      ${isPast ? '<span class="text-slate-500 font-medium">Completada ✓</span>' :
                        isCurrent ? '<span class="badge badge-success text-[10px]">Semana Actual</span>' :
                        '<span class="text-slate-400">Futura</span>'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/**
 * Sub-View 2: Training Groups Configuration
 */
function renderGroupsConfig(club) {
  const groupCounts = {
    group_sprint: club.swimmers.filter(s => s.trainingGroupId === 'group_sprint').length,
    group_distance: club.swimmers.filter(s => s.trainingGroupId === 'group_distance').length,
    group_strokes: club.swimmers.filter(s => s.trainingGroupId === 'group_strokes').length,
    default: club.swimmers.filter(s => s.trainingGroupId === 'default' || !s.trainingGroupId).length
  };

  return `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-xl font-bold text-white flex items-center gap-2">
            <span>🏊‍♀️</span> Grupos de Adestramento Especializados
          </h3>
          <p class="text-xs text-slate-400">Personaliza o volume semanal, intensidades e técnica de cada grupo</p>
        </div>
        <button id="btn-save-groups" class="btn btn-primary btn-sm px-4 font-semibold">
          💾 Gardar Axustes de Grupos
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${renderGroupCard(club, 'group_sprint', '⚡ Grupo Velocistas (50m - 100m)', groupCounts.group_sprint)}
        ${renderGroupCard(club, 'group_distance', '🌊 Grupo Fondistas (200m - 1500m)', groupCounts.group_distance)}
        ${renderGroupCard(club, 'group_strokes', '🦋 Grupo Estilistas & Estilos Puros', groupCounts.group_strokes)}
        ${renderGroupCard(club, 'default', '📋 Grupo Xeral do Club', groupCounts.default)}
      </div>
    </div>
  `;
}

function renderGroupCard(club, groupId, title, swimmerCount) {
  const group = club.trainingGroups[groupId] || {
    id: groupId,
    focusStroke: 'balanced',
    volumeLevel: 'medium',
    intensityMix: { aerobic: 45, threshold: 35, sprint: 20 },
    gymFocus: 'general'
  };

  return `
    <div class="glass-card p-5 rounded-2xl space-y-4 border border-slate-700/60" data-group-id="${groupId}">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h4 class="font-bold text-white text-base">${title}</h4>
          <span class="text-xs text-cyan-400">${swimmerCount} nadadores asignados</span>
        </div>
        <button class="btn btn-xs btn-outline btn-manage-group-swimmers" data-group="${groupId}">
          Asignar Nadadores
        </button>
      </div>

      <!-- Volume Level -->
      <div>
        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
          Volume Semanal de Kilómetros
        </label>
        <select class="input-group-volume bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg w-full px-3 py-2">
          <option value="low" ${group.volumeLevel === 'low' ? 'selected' : ''}>Baixo (~20 km/sem) · Conservador / Recuperación</option>
          <option value="medium" ${group.volumeLevel === 'medium' ? 'selected' : ''}>Medio (~40 km/sem) · Estándar equilibrado</option>
          <option value="high" ${group.volumeLevel === 'high' ? 'selected' : ''}>Alto (~60 km/sem) · Gran estímulo (acumula fatiga)</option>
          <option value="extreme" ${group.volumeLevel === 'extreme' ? 'selected' : ''}>Extremo (~80 km/sem) · Máxima sobrecarga</option>
        </select>
      </div>

      <!-- Stroke Focus -->
      <div>
        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
          Énfase Técnico de Estilo
        </label>
        <select class="input-group-stroke bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg w-full px-3 py-2">
          <option value="balanced" ${group.focusStroke === 'balanced' ? 'selected' : ''}>Equilibrado (Todos os estilos)</option>
          <option value="freestyle" ${group.focusStroke === 'freestyle' ? 'selected' : ''}>Crol / Libre</option>
          <option value="backstroke" ${group.focusStroke === 'backstroke' ? 'selected' : ''}>Costas</option>
          <option value="breaststroke" ${group.focusStroke === 'breaststroke' ? 'selected' : ''}>Braza</option>
          <option value="butterfly" ${group.focusStroke === 'butterfly' ? 'selected' : ''}>Bolboreta</option>
          <option value="IM" ${group.focusStroke === 'IM' ? 'selected' : ''}>Estilos Individuais (IM)</option>
        </select>
      </div>

      <!-- Intensity Mix -->
      <div>
        <div class="flex justify-between items-center mb-1.5">
          <label class="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Repartición da Intensidade
          </label>
          <span class="text-[11px] text-slate-400">Aeróbico / Limiar / Velocidade</span>
        </div>
        <div class="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span class="text-emerald-400 font-semibold block text-[11px] mb-0.5">Aeróbico %</span>
            <input type="number" min="0" max="100" class="input-group-aerobic bg-slate-800 border border-slate-700 text-white rounded px-2 py-1.5 w-full font-mono text-center" value="${group.intensityMix.aerobic}">
          </div>
          <div>
            <span class="text-amber-400 font-semibold block text-[11px] mb-0.5">Limiar %</span>
            <input type="number" min="0" max="100" class="input-group-threshold bg-slate-800 border border-slate-700 text-white rounded px-2 py-1.5 w-full font-mono text-center" value="${group.intensityMix.threshold}">
          </div>
          <div>
            <span class="text-cyan-400 font-semibold block text-[11px] mb-0.5">Velocidade %</span>
            <input type="number" min="0" max="100" class="input-group-sprint bg-slate-800 border border-slate-700 text-white rounded px-2 py-1.5 w-full font-mono text-center" value="${group.intensityMix.sprint}">
          </div>
        </div>
      </div>
    </div>
  `;
}

function getWeekPhase(club, weekNum, defaultPhase) {
  if (club.customWeeklyPhases && club.customWeeklyPhases[weekNum]) {
    const customId = club.customWeeklyPhases[weekNum];
    const match = Object.values(PERIODIZATION_PHASES).find(p => p.id === customId);
    if (match) return match;
  }
  return defaultPhase;
}

export function setupTrainingEvents(container) {
  const club = gameState.leagueEngine.playerClub;

  // Subtab switcher
  container.querySelectorAll('.subtab-btn').forEach(btn => {
    btn.onclick = () => {
      activeTrainingSubTab = btn.getAttribute('data-subtab');
      gameState.triggerUIUpdate();
    };
  });

  // Apply current week phase directly
  const applyCurrentBtn = container.querySelector('#btn-apply-current-phase');
  if (applyCurrentBtn) {
    applyCurrentBtn.onclick = () => {
      const selectedPhaseId = container.querySelector('#select-current-week-phase').value;
      club.setWeeklyPhase(gameState.leagueEngine.currentWeek, selectedPhaseId);
      gameState.notify(`Carga da Semana ${gameState.leagueEngine.currentWeek} actualizada!`, 'success');
      gameState.saveToLocalStorage();
      gameState.triggerUIUpdate();
    };
  }

  // Individual week dropdown changes
  container.querySelectorAll('.select-week-phase').forEach(sel => {
    sel.onchange = (e) => {
      const week = parseInt(sel.getAttribute('data-week'));
      const phaseId = e.target.value;
      club.setWeeklyPhase(week, phaseId);
      gameState.notify(`Semana ${week} configurada para ${phaseId.toUpperCase()}`, 'info');
      gameState.saveToLocalStorage();
      gameState.triggerUIUpdate();
    };
  });

  // Auto-schedule tapers before all 4 meets
  const autoTaperBtn = container.querySelector('#btn-auto-tapers');
  if (autoTaperBtn) {
    autoTaperBtn.onclick = () => {
      club.setupAutoMeetTapers(gameState.leagueEngine.schedule);
      gameState.notify('Descargas (Taper) programadas automaticamente para as semanas previas ás 4 xornadas!', 'success');
      gameState.saveToLocalStorage();
      gameState.triggerUIUpdate();
    };
  }

  // Reset to default schedule
  const resetPlanBtn = container.querySelector('#btn-reset-plan');
  if (resetPlanBtn) {
    resetPlanBtn.onclick = () => {
      if (confirm('¿Restablecer todo o calendario de periodización ao plan por defecto da FEGAN?')) {
        club.resetWeeklyPhases();
        gameState.notify('Plan de adestramento restablecido aos valores por defecto.', 'info');
        gameState.saveToLocalStorage();
        gameState.triggerUIUpdate();
      }
    };
  }

  // Batch Range Tool
  const applyBatchBtn = container.querySelector('#btn-apply-batch');
  if (applyBatchBtn) {
    applyBatchBtn.onclick = () => {
      const phaseId = container.querySelector('#select-batch-phase').value;
      const startW = parseInt(container.querySelector('#input-batch-start').value) || 1;
      const endW = parseInt(container.querySelector('#input-batch-end').value) || 36;

      club.setBatchWeeklyPhases(startW, endW, phaseId);
      gameState.notify(`Aplicado ${phaseId.toUpperCase()} desde a Semana ${startW} ata a Semana ${endW}!`, 'success');
      gameState.saveToLocalStorage();
      gameState.triggerUIUpdate();
    };
  }

  // Save groups
  const saveGroupsBtn = container.querySelector('#btn-save-groups');
  if (saveGroupsBtn) {
    saveGroupsBtn.onclick = () => {
      container.querySelectorAll('[data-group-id]').forEach(card => {
        const groupId = card.getAttribute('data-group-id');
        const volumeLevel = card.querySelector('.input-group-volume').value;
        const focusStroke = card.querySelector('.input-group-stroke').value;
        const aerobic = parseInt(card.querySelector('.input-group-aerobic').value) || 40;
        const threshold = parseInt(card.querySelector('.input-group-threshold').value) || 35;
        const sprint = parseInt(card.querySelector('.input-group-sprint').value) || 25;

        club.trainingGroups[groupId] = {
          id: groupId,
          volumeLevel,
          focusStroke,
          intensityMix: { aerobic, threshold, sprint }
        };
      });

      gameState.notify('Axustes de grupos de adestramento gardados con éxito!', 'success');
      gameState.saveToLocalStorage();
    };
  }

  // Manage swimmers link
  container.querySelectorAll('.btn-manage-group-swimmers').forEach(btn => {
    btn.onclick = () => {
      gameState.activeTab = 'swimmers';
      gameState.triggerUIUpdate();
    };
  });
}
