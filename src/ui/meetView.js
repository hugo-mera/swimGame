// Meet & Race Simulation UI View
// Full FEGAN Circular 26-14 Compliance: Lineup selector, 45-min scratch room, 2D Pool Canvas
import { gameState } from '../gameState.js';
import { MEET_PROGRAMS, STROKES, STROKE_LABELS, PARTICIPATION_LIMITS, DIVISIONS } from '../constants.js';
import { AICoach } from '../engine/ai.js';
import { RaceSimulation } from '../engine/simulation.js';
import { PoolRenderer } from '../graphics/poolCanvas.js';
import { soundManager } from '../audio/soundFx.js';

let poolRenderer = null;
let animFrameId = null;
let currentProgram = null;
let meetPhaseState = 'ROSTER_SELECTION'; // 'ROSTER_SELECTION', 'SCRATCH_ROOM', 'RACING', 'MEET_FINISHED'

export function renderMeet() {
  const { leagueEngine } = gameState;
  const club = leagueEngine.playerClub;
  const scheduleEvent = leagueEngine.getCurrentScheduleEvent();

  // Determine current meet program
  if (scheduleEvent.program) {
    currentProgram = scheduleEvent.program;
  } else if (scheduleEvent.meetKey && MEET_PROGRAMS[scheduleEvent.meetKey]) {
    currentProgram = MEET_PROGRAMS[scheduleEvent.meetKey];
  } else if (scheduleEvent.type === 'final_meet') {
    currentProgram = MEET_PROGRAMS.FASE_FINAL_S1;
  } else {
    // Upcoming meet preview
    const nextMeet = leagueEngine.schedule.find(s => s.week >= leagueEngine.currentWeek && (s.type === 'meet' || s.type === 'final_meet'));
    currentProgram = (nextMeet && nextMeet.program) ? nextMeet.program : MEET_PROGRAMS.XORNADA_A;
  }

  const isMeetWeek = scheduleEvent.type === 'meet' || scheduleEvent.type === 'final_meet';
  const isRosterWeek = scheduleEvent.type === 'roster_deadline' || isMeetWeek;

  if (meetPhaseState === 'RACING') {
    return renderLiveRaceView(scheduleEvent);
  } else if (meetPhaseState === 'SCRATCH_ROOM') {
    return renderScratchRoomView(club, scheduleEvent);
  } else if (meetPhaseState === 'MEET_FINISHED') {
    return renderMeetFinishedSummaryView(scheduleEvent);
  }

  // Default: Stage 1 Roster Selection
  return renderRosterSelectionView(club, scheduleEvent, isRosterWeek);
}

/**
 * Stage 1: Roster Selection & Entry Grid
 */
function renderRosterSelectionView(club, scheduleEvent, isRosterWeek) {
  const { leagueEngine } = gameState;
  const isFinalPhase = leagueEngine.phase === 'final_phase';

  // Count individual events entered so far for each swimmer
  const swimmerEventCounts = {};
  club.swimmers.forEach(s => swimmerEventCounts[s.id] = 0);

  currentProgram.forEach(event => {
    if (!event.isRelay) {
      const entered = club.currentMeetEntries[event.id] || [];
      entered.forEach(sId => {
        swimmerEventCounts[sId] = (swimmerEventCounts[sId] || 0) + 1;
      });
    }
  });

  return `
    <div class="space-y-6">
      <!-- Top Meet Header -->
      <div class="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-2xl font-black text-white">${scheduleEvent.name}</h2>
            <span class="badge ${isRosterWeek ? 'badge-success' : 'badge-warning'} text-xs">
              ${isRosterWeek ? 'Inscrición Aberta' : 'Fase de Preparación'}
            </span>
          </div>
          <p class="text-xs text-slate-300 mt-1">
            Normativa FEGAN: Máx. 2 probas individuais por nadador · Máx. 2 nadadores por club por proba (1 en fondo en 3ª Div)
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button id="btn-auto-fill-roster" class="btn btn-secondary btn-sm text-xs font-semibold flex items-center gap-1.5">
            <span>✨</span> Auto-Completar con IA
          </button>
          <button id="btn-confirm-entries" class="btn btn-primary btn-sm text-xs font-semibold flex items-center gap-1.5">
            <span>📋</span> Validar & Enviar Inscrición
          </button>
        </div>
      </div>

      <!-- Quick Swimmer Limit Overview Badge Row -->
      <div class="glass-card p-4 rounded-xl flex items-center justify-between text-xs text-slate-300">
        <span class="font-semibold text-slate-400">Estado de Participacións na Xornada:</span>
        <div class="flex flex-wrap gap-2">
          ${club.swimmers.map(s => {
            const count = swimmerEventCounts[s.id] || 0;
            let badgeClass = 'bg-slate-800 text-slate-300';
            if (count === 2) badgeClass = 'bg-emerald-950 text-emerald-300 border border-emerald-500/50';
            else if (count > 2) badgeClass = 'bg-rose-950 text-rose-300 border border-rose-500 font-bold';

            return `
              <span class="px-2 py-1 rounded text-[11px] ${badgeClass}">
                ${s.firstName}: ${count}/2
              </span>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Events List & Line-Up Assignment -->
      <div class="space-y-4">
        ${currentProgram.map((event, evIdx) => {
          const currentEntered = club.currentMeetEntries[event.id] || [];

          if (event.isRelay) {
            return renderRelayEventCard(club, event, evIdx, currentEntered);
          } else {
            return renderIndividualEventCard(club, event, evIdx, currentEntered, isFinalPhase);
          }
        }).join('')}
      </div>

      <!-- Reserve Swimmers Selection -->
      <div class="glass-card p-5 rounded-2xl border border-slate-700/60">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h4 class="font-bold text-white text-base">Reservas do Club (Circular 26-14 art. 3.8)</h4>
            <p class="text-xs text-slate-400">Só nadadores que NON estean inscritos en ningunha proba poden ser reservas</p>
          </div>
          <span class="badge badge-primary text-xs">${(club.meetReserves || []).filter(Boolean).length}/4 Reservas</span>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          ${(() => {
            // Find all swimmer IDs currently entered in ANY individual or relay event
            const allEnteredIds = new Set();
            Object.values(club.currentMeetEntries || {}).forEach(list => {
              if (Array.isArray(list)) {
                list.forEach(id => { if (id) allEnteredIds.add(id); });
              }
            });

            return [0, 1, 2, 3].map(slotIdx => {
              const currentReserveId = (club.meetReserves && club.meetReserves[slotIdx]) || '';
              const otherReserveIds = (club.meetReserves || []).filter((id, idx) => idx !== slotIdx && Boolean(id));
              // Eligible reserves are strictly those not entered in any event (plus current selection for this slot) and not in other reserve slots
              const availableReserves = club.swimmers.filter(s => (!allEnteredIds.has(s.id) && !otherReserveIds.includes(s.id)) || s.id === currentReserveId);

              return `
                <div>
                  <label class="block text-[11px] text-slate-400 font-semibold mb-1">Reserva #${slotIdx + 1}</label>
                  <select class="select-reserve-swimmer bg-slate-800 border border-slate-700 text-white text-xs rounded-lg w-full p-2" data-slot="${slotIdx}">
                    <option value="">-- Sen Reserva --</option>
                    ${availableReserves.map(s => `
                      <option value="${s.id}" ${currentReserveId === s.id ? 'selected' : ''}>
                        ${s.fullName} (${s.gender}, ${s.overallRating} med)
                      </option>
                    `).join('')}
                  </select>
                </div>
              `;
            }).join('');
          })()}
        </div>
      </div>
    </div>
  `;
}

function getRelevantStatsForEvent(event, swimmer) {
  const dist = event.distance;
  const stroke = event.stroke;

  if (stroke === STROKES.FREE) {
    if (dist <= 50) {
      return `Vel: ${Math.round(swimmer.stats.speed)} | Crol: ${Math.round(swimmer.stats.freestyle)} | For: ${Math.round(swimmer.stats.strength)}`;
    } else if (dist <= 100) {
      return `Vel: ${Math.round(swimmer.stats.speed)} | Crol: ${Math.round(swimmer.stats.freestyle)} | Fon: ${Math.round(swimmer.stats.distance)}`;
    } else if (dist <= 200) {
      return `Crol: ${Math.round(swimmer.stats.freestyle)} | Fon: ${Math.round(swimmer.stats.distance)} | Vel: ${Math.round(swimmer.stats.speed)}`;
    } else {
      // 400m, 800m, 1500m
      return `Resistencia: ${Math.round(swimmer.stats.distance)} | Crol: ${Math.round(swimmer.stats.freestyle)}`;
    }
  } else if (stroke === STROKES.IM) {
    if (dist <= 100) {
      return `Estilos: ${Math.round(swimmer.stats.IM)} | Vel: ${Math.round(swimmer.stats.speed)}`;
    } else if (dist <= 200) {
      return `Estilos: ${Math.round(swimmer.stats.IM)} | Fondo: ${Math.round(swimmer.stats.distance)} | Vel: ${Math.round(swimmer.stats.speed)}`;
    } else {
      return `Estilos: ${Math.round(swimmer.stats.IM)} | Resistencia: ${Math.round(swimmer.stats.distance)}`;
    }
  } else {
    // Back, Breast, Fly
    const strokeLabel = STROKE_LABELS[stroke] ? STROKE_LABELS[stroke].split(' ')[0] : stroke;
    const strokeVal = Math.round(swimmer.stats[stroke] || 50);
    if (dist <= 50) {
      return `${strokeLabel}: ${strokeVal} | Vel: ${Math.round(swimmer.stats.speed)} | For: ${Math.round(swimmer.stats.strength)}`;
    } else if (dist <= 100) {
      return `${strokeLabel}: ${strokeVal} | Vel: ${Math.round(swimmer.stats.speed)} | Fon: ${Math.round(swimmer.stats.distance)}`;
    } else {
      return `${strokeLabel}: ${strokeVal} | Resistencia: ${Math.round(swimmer.stats.distance)}`;
    }
  }
}

function getEligibleSwimmersForEventSlot(club, event, slotIdx, isFinalPhase) {
  const currentEntered = club.currentMeetEntries[event.id] || [];
  const currentlySelectedId = currentEntered[slotIdx] || null;
  const otherSlotId = slotIdx === 0 ? currentEntered[1] : currentEntered[0];

  // Count individual events in current meet excluding THIS event
  const meetCounts = {};
  club.swimmers.forEach(s => meetCounts[s.id] = 0);
  currentProgram.forEach(ev => {
    if (!ev.isRelay && ev.id !== event.id) {
      const list = club.currentMeetEntries[ev.id] || [];
      list.forEach(sId => {
        if (sId) meetCounts[sId] = (meetCounts[sId] || 0) + 1;
      });
    }
  });

  return club.swimmers.filter(s => {
    // 1. Gender check
    if (s.gender !== event.gender) return false;

    // 2. Can't be in the other slot of the same event
    if (otherSlotId && s.id === otherSlotId) return false;

    // 3. Max 2 individual events in this session (FEGAN limit)
    // If already in 2 other events, do not display
    if (s.id !== currentlySelectedId && meetCounts[s.id] >= PARTICIPATION_LIMITS.MAX_INDIVIDUAL_PER_SESSION) {
      return false;
    }

    // 4. Phase total limits
    const swumPhase = isFinalPhase ? (club.finalEventsSwum[s.id] || 0) : (club.prelimEventsSwum[s.id] || 0);
    const maxPhase = isFinalPhase ? PARTICIPATION_LIMITS.MAX_INDIVIDUAL_FINAL_TOTAL : PARTICIPATION_LIMITS.MAX_INDIVIDUAL_PRELIM_TOTAL;
    if (s.id !== currentlySelectedId && swumPhase >= maxPhase) {
      return false;
    }

    return true;
  });
}

function renderIndividualEventCard(club, event, evIdx, enteredIds, isFinalPhase) {
  const isLongDist = [400, 800, 1500].includes(event.distance);
  const isDiv3Prelim = !isFinalPhase && club.division === DIVISIONS.DIV3;
  const maxSlots = isDiv3Prelim && isLongDist ? 1 : 2;

  return `
    <div class="glass-card p-4 rounded-xl border border-slate-700/60 hover:border-cyan-500/40 transition-colors">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-2.5 mb-3">
        <div class="flex items-center gap-3">
          <span class="font-mono font-bold text-cyan-400 text-sm">#${evIdx + 1}</span>
          <div>
            <h4 class="font-bold text-white text-base">${event.name}</h4>
            <span class="text-xs text-slate-400">
              ${event.gender === 'M' ? 'Masculino' : 'Feminino'} · Distancia: ${event.distance}m · Estilo: ${STROKE_LABELS[event.stroke]}
            </span>
          </div>
        </div>
        <div class="text-xs text-slate-400">
          Tope proba: <strong class="text-white">${maxSlots} nadador(es)</strong>
        </div>
      </div>

      <!-- 1 or 2 slots -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${[0, maxSlots > 1 ? 1 : null].filter(x => x !== null).map(slotIdx => {
          const selectedId = enteredIds[slotIdx] || '';
          const selectedSwimmer = selectedId ? club.getSwimmer(selectedId) : null;
          const eligibleList = getEligibleSwimmersForEventSlot(club, event, slotIdx, isFinalPhase);

          return `
            <div class="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40">
              <label class="block text-xs font-semibold text-slate-300 mb-1">
                Posto #${slotIdx + 1} ${selectedSwimmer ? `<span class="text-cyan-400 font-mono">(${RaceSimulation.formatTime(selectedSwimmer.getEstimatedTime(event))} est.)</span>` : ''}
              </label>
              <select class="select-event-swimmer bg-slate-800 border border-slate-700 text-white text-xs rounded-lg w-full p-2 focus:ring-1 focus:ring-cyan-500" data-event-id="${event.id}" data-slot="${slotIdx}">
                <option value="">-- Seleccionar Nadador --</option>
                ${eligibleList.map(s => {
                  const estTime = RaceSimulation.formatTime(s.getEstimatedTime(event));
                  const statsStr = getRelevantStatsForEvent(event, s);
                  return `
                    <option value="${s.id}" ${selectedId === s.id ? 'selected' : ''}>
                      ${s.fullName} · [${statsStr}] · (${estTime})
                    </option>
                  `;
                }).join('')}
              </select>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function getEligibleSwimmersForRelayLeg(club, event, legIdx, enteredIds) {
  const isMixed = event.gender === 'MIXED';
  const currentlySelectedId = enteredIds[legIdx] || null;
  // All swimmers selected in other legs of THIS relay
  const otherLegIds = (enteredIds || []).filter((id, idx) => idx !== legIdx && Boolean(id));

  // Base pool by gender
  const pool = isMixed ? club.swimmers : club.swimmers.filter(s => s.gender === event.gender);

  return pool.filter(s => {
    // 1. A swimmer cannot be in any other leg of this same relay
    if (otherLegIds.includes(s.id)) return false;

    // 2. If mixed relay, ensure 2M + 2F constraint isn't exceeded by this selection
    if (isMixed && s.id !== currentlySelectedId) {
      const otherSwimmers = otherLegIds.map(id => club.getSwimmer(id)).filter(Boolean);
      const mCount = otherSwimmers.filter(sw => sw.gender === 'M').length;
      const fCount = otherSwimmers.filter(sw => sw.gender === 'F').length;

      if (s.gender === 'M' && mCount >= 2) return false;
      if (s.gender === 'F' && fCount >= 2) return false;
    }

    return true;
  });
}

function renderRelayEventCard(club, event, evIdx, enteredIds) {
  const isMixed = event.gender === 'MIXED';

  return `
    <div class="glass-card p-4 rounded-xl border border-cyan-500/40 bg-cyan-950/10">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-2.5 mb-3">
        <div class="flex items-center gap-3">
          <span class="font-mono font-bold text-cyan-400 text-sm">#${evIdx + 1}</span>
          <div>
            <h4 class="font-bold text-white text-base flex items-center gap-2">
              <span>🏊‍♂️🏊‍♀️</span> ${event.name}
              <span class="badge badge-primary text-[10px]">Relevo 4x</span>
            </h4>
            <span class="text-xs text-slate-400">
              ${isMixed ? 'Mixto (2M + 2F)' : event.gender === 'M' ? 'Masculino' : 'Feminino'} · 4 relevistas (sen repetir nadador)
            </span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        ${[0, 1, 2, 3].map(legIdx => {
          const selectedId = enteredIds[legIdx] || '';
          const legStroke = (event.legs && event.legs[legIdx]) ? event.legs[legIdx] : event.stroke;
          const strokeLabel = STROKE_LABELS[legStroke] || legStroke;
          const eligibleForLeg = getEligibleSwimmersForRelayLeg(club, event, legIdx, enteredIds);

          return `
            <div class="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs">
              <label class="block font-semibold text-cyan-300 text-[11px] mb-1">
                Relevista #${legIdx + 1} (${strokeLabel})
              </label>
              <select class="select-relay-swimmer bg-slate-800 border border-slate-700 text-white text-xs rounded-lg w-full p-2" data-event-id="${event.id}" data-leg="${legIdx}">
                <option value="">-- Seleccionar --</option>
                ${eligibleForLeg.map(s => {
                  const strokeVal = Math.round(s.stats[legStroke] || s.stats.freestyle || 50);
                  const isLongLeg = (event.legDist || 50) >= 200;
                  const statExtra = isLongLeg
                    ? `Fon: ${Math.round(s.stats.distance)}`
                    : `Vel: ${Math.round(s.stats.speed)}`;
                  return `
                    <option value="${s.id}" ${selectedId === s.id ? 'selected' : ''}>
                      ${s.fullName} (${s.gender}) · ${strokeLabel}: ${strokeVal} (${statExtra})
                    </option>
                  `;
                }).join('')}
              </select>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Stage 2: 45-Minute Pre-Meet Scratch Room
 */
function renderScratchRoomView(club, scheduleEvent) {
  const currentEntries = club.currentMeetEntries || {};
  const reserves = (club.meetReserves || []).map(id => club.getSwimmer(id)).filter(Boolean);

  return `
    <div class="space-y-6">
      <div class="glass-card p-6 rounded-2xl border-l-4 border-amber-500">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs uppercase tracking-wider text-amber-400 font-bold">Cámara de Chamadas · FEGAN Art. 3.7</span>
              <span class="badge badge-warning text-xs">45 minutos antes da sesión</span>
            </div>
            <h2 class="text-2xl font-black text-white mt-1">Últimos Cambios de Nadadores & Relevos</h2>
            <p class="text-xs text-slate-300 mt-1 max-w-2xl">
              Comproba a fatiga e forma física dos teus nadadores antes de entrar á piscina. Podes facer baixas e substituír con reservas.
            </p>
          </div>
          <button id="btn-start-racing-now" class="btn btn-primary py-3 px-6 font-bold text-sm flex items-center gap-2">
            <span>🏊</span> ¡Entrar á Piscina e Comezar!
          </button>
        </div>
      </div>

      <!-- Swimmer Condition & Lineup Summary -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Entered Swimmers Condition -->
        <div class="glass-card p-5 rounded-2xl">
          <h4 class="font-bold text-white text-base mb-3 flex items-center gap-2">
            <span>📋</span> Nadadores Titulares na Xornada
          </h4>
          <div class="space-y-2 max-h-96 overflow-y-auto">
            ${club.swimmers.map(s => {
              // Check what events they swim
              const enteredEvents = [];
              Object.entries(currentEntries).forEach(([evId, list]) => {
                if (list.includes(s.id)) {
                  const ev = currentProgram.find(e => e.id === evId);
                  if (ev) enteredEvents.push(ev.name);
                }
              });

              if (enteredEvents.length === 0) return '';

              const totalFatigue = Math.round((s.chronicFatigue + s.acuteFatigue) / 2);
              return `
                <div class="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs flex items-center justify-between">
                  <div>
                    <div class="font-bold text-white text-sm">${s.fullName}</div>
                    <div class="text-[11px] text-cyan-300">${enteredEvents.join(' · ')}</div>
                  </div>
                  <div class="text-right">
                    <span class="badge ${totalFatigue > 55 ? 'badge-danger' : totalFatigue > 35 ? 'badge-warning' : 'badge-success'} text-[10px]">
                      Fatiga: ${totalFatigue}%
                    </span>
                    <div class="text-[11px] text-slate-400 mt-0.5">Forma: ${s.form}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Reserves Ready to Sub In -->
        <div class="glass-card p-5 rounded-2xl">
          <h4 class="font-bold text-white text-base mb-3 flex items-center gap-2">
            <span>🛡️</span> Reservas Dispoñibles para Baixas
          </h4>
          ${reserves.length > 0 ? `
            <div class="space-y-2">
              ${reserves.map(res => `
                <div class="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs flex items-center justify-between">
                  <div>
                    <div class="font-bold text-white text-sm">${res.fullName}</div>
                    <div class="text-[11px] text-slate-400">${res.gender === 'M' ? 'Masc' : 'Fem'} · ${res.age} anos · Media ${res.overallRating}</div>
                  </div>
                  <span class="badge badge-primary text-[10px]">Reserva Oficial</span>
                </div>
              `).join('')}
            </div>
          ` : '<p class="text-xs text-slate-400">Non rexistraches nadadores de reserva para esta xornada.</p>'}
        </div>
      </div>
    </div>
  `;
}

/**
 * Stage 3: Live Race Simulation & 2D Pool Canvas Viewer
 */
function renderLiveRaceView(scheduleEvent) {
  const { activeMeet } = gameState;
  const currentEvent = activeMeet.meetProgram[activeMeet.currentEventIdx];

  return `
    <div class="space-y-4">
      <!-- 2D Canvas Pool Container -->
      <div class="glass-card p-3 rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
        <canvas id="pool-canvas" width="900" height="420" class="w-full rounded-xl block bg-slate-950"></canvas>
      </div>

      <!-- Race Controls & Simulation Bar -->
      <div class="glass-card p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <button id="btn-toggle-sim" class="btn btn-primary btn-sm px-4 font-bold flex items-center gap-1.5">
            <span id="sim-play-icon">⏸️</span> <span id="sim-play-text">Pausar</span>
          </button>
          
          <div class="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs">
            <button class="px-2.5 py-1 rounded font-mono font-bold speed-btn ${activeMeet.simSpeed === 1 ? 'bg-cyan-600 text-white' : 'text-slate-400'}" data-speed="1">1x</button>
            <button class="px-2.5 py-1 rounded font-mono font-bold speed-btn ${activeMeet.simSpeed === 2 ? 'bg-cyan-600 text-white' : 'text-slate-400'}" data-speed="2">2x</button>
            <button class="px-2.5 py-1 rounded font-mono font-bold speed-btn ${activeMeet.simSpeed === 5 ? 'bg-cyan-600 text-white' : 'text-slate-400'}" data-speed="5">5x</button>
          </div>

          <button id="btn-skip-event" class="btn btn-outline btn-sm text-xs font-semibold">
            ⏩ Saltar ao Final
          </button>
        </div>

        <div class="flex items-center gap-4">
          <button id="btn-toggle-audio" class="btn btn-outline btn-sm text-xs flex items-center gap-1.5">
            <span>🔊</span> Son Activado
          </button>

          <span id="race-event-counter" class="text-xs text-slate-400 font-mono">
            Proba <strong>${activeMeet.currentEventIdx + 1}</strong> de <strong>${activeMeet.meetProgram.length}</strong>
          </span>

          <button id="btn-next-event" class="btn btn-success btn-sm font-bold text-xs flex items-center gap-1.5" ${!activeMeet.currentEventFinished ? 'disabled' : ''}>
            <span id="btn-next-event-text">${activeMeet.currentEventIdx + 1 >= activeMeet.meetProgram.length ? '🏁 Finalizar Xornada' : 'Seguinte Proba ➡️'}</span>
          </button>
        </div>
      </div>

      <!-- Live Results & Points Table for Current Event -->
      <div class="glass-card rounded-2xl overflow-hidden border border-slate-700/60">
        <div class="p-3 border-b border-slate-800 flex items-center justify-between">
          <h4 class="font-bold text-white text-sm flex items-center gap-2">
            <span>⏱️</span> Clasificación Oficial da Proba: <span id="race-event-title-name" class="text-cyan-400 font-bold">${currentEvent.name}</span>
          </h4>
          <span class="text-xs text-slate-400">Puntuación FEGAN aplicada</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                <th class="py-2.5 px-3">Posto</th>
                <th class="py-2.5 px-2 text-center">Rúa</th>
                <th class="py-2.5 px-3">Nadador / Relevo</th>
                <th class="py-2.5 px-3">Club</th>
                <th class="py-2.5 px-3 text-right font-mono">Marca Final</th>
                <th class="py-2.5 px-3 text-right text-cyan-300 font-bold">Puntos FEGAN</th>
              </tr>
            </thead>
            <tbody id="live-results-tbody" class="divide-y divide-slate-800/60 font-mono">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/**
 * Stage 4: Meet Summary & Xornada Points Awarded
 */
function renderMeetFinishedSummaryView(scheduleEvent) {
  const { activeMeet, leagueEngine } = gameState;
  const club = leagueEngine.playerClub;

  const standings = activeMeet.finalStandings || [];

  return `
    <div class="glass-card p-8 rounded-2xl space-y-6 text-center max-w-3xl mx-auto">
      <div class="text-5xl">🏆</div>
      <h2 class="text-3xl font-black text-white">Xornada Finalizada!</h2>
      <p class="text-sm text-slate-300 max-w-lg mx-auto">
        Completáronse todas as probas do programa oficial. Aquí tes a puntuación final desta xornada e os puntos asignados para a clasificación xeral da Liga Galega de Clubs.
      </p>

      <div class="glass-card rounded-xl overflow-hidden text-left border border-slate-700/60">
        <table class="w-full text-xs">
          <thead>
            <tr class="bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold uppercase">
              <th class="py-3 px-4">Posto Xornada</th>
              <th class="py-3 px-4">Club</th>
              <th class="py-3 px-3 text-center">Puntos Probas</th>
              <th class="py-3 px-4 text-right text-cyan-300">Puntos Liga Gañados</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            ${standings.map((s, idx) => `
              <tr class="${s.club.id === club.id ? 'bg-cyan-950/40 text-cyan-200 font-bold' : 'text-slate-300'}">
                <td class="py-3 px-4 font-mono">${idx + 1}º</td>
                <td class="py-3 px-4 flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full" style="background-color: ${s.club.primaryColor};"></span>
                  <span>${s.club.name}</span>
                  ${s.club.id === club.id ? '<span class="badge badge-primary text-[10px] ml-1">Ti</span>' : ''}
                </td>
                <td class="py-3 px-3 text-center font-mono">${s.pointsScored}</td>
                <td class="py-3 px-4 text-right font-mono font-bold text-emerald-400">+${s.xornadaPointsEarned} pts</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="pt-4">
        <button id="btn-finish-meet-and-return" class="btn btn-primary px-8 py-3 font-bold text-sm">
          Continuar Tempada e Volver ao Panel →
        </button>
      </div>
    </div>
  `;
}

export function setupMeetEvents(container) {
  const { leagueEngine, activeMeet } = gameState;
  const club = leagueEngine.playerClub;

  // Auto-Fill with AI Coach
  const autoFillBtn = container.querySelector('#btn-auto-fill-roster');
  if (autoFillBtn) {
    autoFillBtn.onclick = () => {
      const isFinalPhase = leagueEngine.phase === 'final_phase';
      const divClubs = leagueEngine.divisions[club.division] || [];
      const { entries, reserves } = AICoach.generateMeetRoster(
        club,
        currentProgram,
        isFinalPhase,
        1.0, // Best possible line-up for player
        divClubs.length
      );
      club.currentMeetEntries = entries;
      club.meetReserves = reserves;
      gameState.notify('Convocatoria auto-completada con éxito segundo a normativa FEGAN!', 'success');
      gameState.triggerUIUpdate();
    };
  }

  // Individual swimmer selection
  container.querySelectorAll('.select-event-swimmer').forEach(sel => {
    sel.onchange = (e) => {
      const eventId = sel.getAttribute('data-event-id');
      const slot = parseInt(sel.getAttribute('data-slot'));
      const swimmerId = e.target.value;
      const event = currentProgram.find(ev => ev.id === eventId);

      if (!club.currentMeetEntries[eventId]) {
        club.currentMeetEntries[eventId] = [];
      }

      if (!swimmerId) {
        club.currentMeetEntries[eventId].splice(slot, 1);
        gameState.triggerUIUpdate();
        return;
      }

      const swimmer = club.getSwimmer(swimmerId);
      const isFinalPhase = leagueEngine.phase === 'final_phase';
      const check = club.validateSwimmerEntry(swimmer, event, isFinalPhase);

      if (!check.valid) {
        gameState.notify(check.reason, 'error');
        sel.value = club.currentMeetEntries[eventId][slot] || '';
        return;
      }

      club.currentMeetEntries[eventId][slot] = swimmerId;
      gameState.triggerUIUpdate();
    };
  });

  // Relay swimmer selection
  container.querySelectorAll('.select-relay-swimmer').forEach(sel => {
    sel.onchange = (e) => {
      const eventId = sel.getAttribute('data-event-id');
      const leg = parseInt(sel.getAttribute('data-leg'));
      const swimmerId = e.target.value;

      if (!club.currentMeetEntries[eventId]) {
        club.currentMeetEntries[eventId] = [];
      }

      if (!swimmerId) {
        club.currentMeetEntries[eventId][leg] = null;
      } else {
        // Prevent assigning the same swimmer to multiple legs of the same relay
        const alreadyInRelay = (club.currentMeetEntries[eventId] || []).some((id, idx) => idx !== leg && id === swimmerId);
        if (alreadyInRelay) {
          gameState.notify('Este nadador xa está asignado a outra posta deste mesmo relevo!', 'warning');
          sel.value = club.currentMeetEntries[eventId][leg] || '';
          return;
        }
        club.currentMeetEntries[eventId][leg] = swimmerId;
      }
      gameState.triggerUIUpdate();
    };
  });

  // Reserve selection
  container.querySelectorAll('.select-reserve-swimmer').forEach(sel => {
    sel.onchange = (e) => {
      const slot = parseInt(sel.getAttribute('data-slot'));
      const swimmerId = e.target.value;
      if (!club.meetReserves) club.meetReserves = [];
      if (swimmerId) {
        // Prevent assigning the same swimmer to multiple reserve slots
        const alreadyReserve = (club.meetReserves || []).some((id, idx) => idx !== slot && id === swimmerId);
        if (alreadyReserve) {
          gameState.notify('Este nadador xa está seleccionado noutro posto de reserva!', 'warning');
          sel.value = club.meetReserves[slot] || '';
          return;
        }
        club.meetReserves[slot] = swimmerId;
      } else {
        club.meetReserves[slot] = null;
      }
      gameState.triggerUIUpdate();
    };
  });

  // Confirm Entries & Go to Scratch Room
  const confirmBtn = container.querySelector('#btn-confirm-entries');
  if (confirmBtn) {
    confirmBtn.onclick = () => {
      // Validate that no relay contains duplicate swimmers
      for (const ev of currentProgram) {
        if (ev.isRelay) {
          const legIds = (club.currentMeetEntries[ev.id] || []).filter(Boolean);
          const uniqueIds = new Set(legIds);
          if (uniqueIds.size !== legIds.length) {
            gameState.notify(`No relevo "${ev.name}" hai nadadores repetidos. Cada posta debe nadala un nadador diferente.`, 'error');
            return;
          }
          if (ev.gender === 'MIXED' && legIds.length === 4) {
            const swimmers = legIds.map(id => club.getSwimmer(id)).filter(Boolean);
            const mCount = swimmers.filter(s => s.gender === 'M').length;
            const fCount = swimmers.filter(s => s.gender === 'F').length;
            if (mCount !== 2 || fCount !== 2) {
              gameState.notify(`No relevo mixto "${ev.name}" deben competir exactamente 2 nadadores masculinos e 2 femininos.`, 'error');
              return;
            }
          }
        }
      }

      // Prepare all AI teams
      const isFinalPhase = leagueEngine.phase === 'final_phase';
      leagueEngine.prepareAIMeetEntries(currentProgram, isFinalPhase);

      meetPhaseState = 'SCRATCH_ROOM';
      gameState.notify('Inscrición rexistrada na Federación Galega de Natación!', 'success');
      gameState.triggerUIUpdate();
    };
  }

  // Start Racing from Scratch Room
  const startRacingBtn = container.querySelector('#btn-start-racing-now');
  if (startRacingBtn) {
    startRacingBtn.onclick = () => {
      meetPhaseState = 'RACING';
      startMeetSimulation(container);
    };
  }

  // Finish Meet and return to dashboard
  const finishReturnBtn = container.querySelector('#btn-finish-meet-and-return');
  if (finishReturnBtn) {
    finishReturnBtn.onclick = () => {
      meetPhaseState = 'ROSTER_SELECTION';
      gameState.activeTab = 'dashboard';
      gameState.leagueEngine.advanceWeek();
      gameState.saveToLocalStorage();
      gameState.triggerUIUpdate();
    };
  }
}

/**
 * Initializes and loops the live race simulation
 */
function startMeetSimulation(container) {
  const { leagueEngine, activeMeet } = gameState;
  const club = leagueEngine.playerClub;
  const isFinalPhase = leagueEngine.phase === 'final_phase';

  activeMeet.inProgress = true;
  activeMeet.meetProgram = currentProgram;
  activeMeet.isFinalPhase = isFinalPhase;
  activeMeet.currentEventIdx = 0;
  activeMeet.currentEventFinished = false;
  activeMeet.isSimulating = true;
  activeMeet.simSpeed = 1.0;
  activeMeet.elapsedSeconds = 0;
  activeMeet.divisionName = club.division;
  activeMeet.meetHistory = [];

  // Reset day-of-meet fatigue for all participating clubs
  const clubs = leagueEngine.divisions[club.division] || [];
  clubs.forEach(c => c.swimmers.forEach(s => s.resetMeetFatigue()));

  gameState.triggerUIUpdate();

  // Run next tick after DOM rendered
  setTimeout(() => {
    setupRaceCanvasAndLoop(container);
  }, 50);
}

function setupRaceCanvasAndLoop(container) {
  const canvas = document.getElementById('pool-canvas');
  if (!canvas) return;

  if (!poolRenderer) {
    poolRenderer = new PoolRenderer(canvas);
  } else {
    poolRenderer.canvas = canvas;
    poolRenderer.ctx = canvas.getContext('2d');
  }

  const { activeMeet, leagueEngine } = gameState;
  const currentEvent = activeMeet.meetProgram[activeMeet.currentEventIdx];
  const clubs = leagueEngine.divisions[activeMeet.divisionName] || [];

  // Update dynamic UI indicators for the current event
  const counterEl = document.getElementById('race-event-counter');
  if (counterEl) {
    counterEl.innerHTML = `Proba <strong>${activeMeet.currentEventIdx + 1}</strong> de <strong>${activeMeet.meetProgram.length}</strong>`;
  }
  const nameEl = document.getElementById('race-event-title-name');
  if (nameEl) {
    nameEl.textContent = currentEvent.name;
  }
  const nextBtnText = document.getElementById('btn-next-event-text');
  if (nextBtnText) {
    nextBtnText.textContent = (activeMeet.currentEventIdx + 1 >= activeMeet.meetProgram.length) ? '🏁 Finalizar Xornada' : 'Seguinte Proba ➡️';
  }
  const nextBtn = document.getElementById('btn-next-event');
  if (nextBtn) {
    nextBtn.disabled = true;
  }
  // Clear previous event results from the live table
  const tbody = document.getElementById('live-results-tbody');
  if (tbody) {
    tbody.innerHTML = '';
  }

  // Simulate this event
  const eventSimulation = RaceSimulation.simulateEvent({
    event: currentEvent,
    division: activeMeet.divisionName,
    clubs,
    isFinalPhase: activeMeet.isFinalPhase,
    eventIndex: activeMeet.currentEventIdx
  });

  if (!activeMeet.meetHistory) activeMeet.meetHistory = [];
  activeMeet.meetHistory[activeMeet.currentEventIdx] = eventSimulation;

  activeMeet.currentEventResults = eventSimulation.results;
  activeMeet.currentEventFinished = false;
  activeMeet.elapsedSeconds = 0;

  poolRenderer.reset();

  // Audio start sequence: Whistle then Buzzer!
  soundManager.playWhistle(true);
  setTimeout(() => {
    soundManager.playStartBuzzer();
  }, 1200);

  // Setup simulation controls
  setupSimulationControls(container, eventSimulation);

  // Start Animation Loop
  let lastTimestamp = performance.now();

  function loop(now) {
    const deltaMs = now - lastTimestamp;
    lastTimestamp = now;

    if (activeMeet.isSimulating && !activeMeet.currentEventFinished) {
      activeMeet.elapsedSeconds += (deltaMs / 1000) * activeMeet.simSpeed;

      const liveResults = RaceSimulation.getLiveStateAtTime(
        activeMeet.currentEventResults,
        currentEvent,
        activeMeet.elapsedSeconds
      );

      const allFinished = liveResults.every(r => r.isFinished);
      if (allFinished) {
        activeMeet.currentEventFinished = true;
        updateResultsTable(activeMeet.currentEventResults);
        const nextBtn = document.getElementById('btn-next-event');
        if (nextBtn) nextBtn.disabled = false;
      }

      poolRenderer.render({
        event: currentEvent,
        liveResults,
        elapsedSeconds: activeMeet.elapsedSeconds,
        allFinished
      });
    }

    if (meetPhaseState === 'RACING') {
      animFrameId = requestAnimationFrame(loop);
    }
  }

  if (animFrameId) cancelAnimationFrame(animFrameId);
  animFrameId = requestAnimationFrame(loop);
}

function setupSimulationControls(container, eventSimulation) {
  const { activeMeet } = gameState;

  // Toggle play/pause
  const toggleBtn = document.getElementById('btn-toggle-sim');
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      activeMeet.isSimulating = !activeMeet.isSimulating;
      document.getElementById('sim-play-icon').textContent = activeMeet.isSimulating ? '⏸️' : '▶️';
      document.getElementById('sim-play-text').textContent = activeMeet.isSimulating ? 'Pausar' : 'Reanudar';
    };
  }

  // Speeds
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.onclick = () => {
      const spd = parseFloat(btn.getAttribute('data-speed'));
      activeMeet.simSpeed = spd;
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('bg-cyan-600', 'text-white'));
      btn.classList.add('bg-cyan-600', 'text-white');
    };
  });

  // Skip to finish
  const skipBtn = document.getElementById('btn-skip-event');
  if (skipBtn) {
    skipBtn.onclick = () => {
      const maxTime = Math.max(...activeMeet.currentEventResults.map(r => r.finalTime));
      activeMeet.elapsedSeconds = maxTime + 0.1;
      activeMeet.currentEventFinished = true;
      updateResultsTable(activeMeet.currentEventResults);
      const nextBtn = document.getElementById('btn-next-event');
      if (nextBtn) nextBtn.disabled = false;
    };
  }

  // Audio toggle
  const audioBtn = document.getElementById('btn-toggle-audio');
  if (audioBtn) {
    audioBtn.onclick = () => {
      const isMuted = soundManager.toggleMute();
      audioBtn.innerHTML = isMuted ? '<span>🔇</span> Son Silenciado' : '<span>🔊</span> Son Activado';
    };
  }

  // Next Event / Finish Meet
  const nextBtn = document.getElementById('btn-next-event');
  if (nextBtn) {
    nextBtn.onclick = () => {
      if (activeMeet.currentEventIdx + 1 < activeMeet.meetProgram.length) {
        activeMeet.currentEventIdx++;
        activeMeet.currentEventFinished = false;
        setupRaceCanvasAndLoop(container);
      } else {
        // Complete the entire meet
        finishEntireMeet();
      }
    };
  }
}

function updateResultsTable(results) {
  const tbody = document.getElementById('live-results-tbody');
  if (!tbody) return;

  tbody.innerHTML = results.map(r => `
    <tr class="hover:bg-slate-800/40">
      <td class="py-2 px-3 font-bold ${r.rank === 1 ? 'text-amber-400' : 'text-white'}">#${r.rank}</td>
      <td class="py-2 px-2 text-center text-slate-400 font-mono">C${r.lane}</td>
      <td class="py-2 px-3">
        <span class="font-bold text-white">${r.isRelay ? r.relayName : r.swimmerName}</span>
        ${r.isPB ? '<span class="badge badge-success text-[9px] ml-1">PB</span>' : ''}
      </td>
      <td class="py-2 px-3 flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${r.clubColor};"></span>
        <span class="text-slate-300 font-sans">${r.clubName}</span>
      </td>
      <td class="py-2 px-3 text-right font-bold text-white">${RaceSimulation.formatTime(r.finalTime)}</td>
      <td class="py-2 px-3 text-right font-bold text-cyan-300 font-mono">+${r.points} pts</td>
    </tr>
  `).join('');
}

function finishEntireMeet() {
  const { activeMeet, leagueEngine } = gameState;

  // Use the live simulated results from meetHistory if available
  const precomputed = (activeMeet.meetHistory && activeMeet.meetHistory.length === activeMeet.meetProgram.length)
    ? activeMeet.meetHistory
    : null;

  // Assign xornada points
  const res = leagueEngine.simulateDivisionMeet(
    activeMeet.divisionName,
    activeMeet.meetProgram,
    activeMeet.isFinalPhase,
    precomputed
  );

  activeMeet.finalStandings = res.clubStandingsThisMeet;
  meetPhaseState = 'MEET_FINISHED';

  if (animFrameId) cancelAnimationFrame(animFrameId);
  gameState.triggerUIUpdate();
}
