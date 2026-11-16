// Standings & Divisions UI View
import { gameState } from '../gameState.js';
import { DIVISIONS, DIVISION_ORDER } from '../constants.js';

let activeDivisionTab = null;

export function renderStandings() {
  const { leagueEngine } = gameState;
  const playerDiv = leagueEngine.playerClub.division;
  if (!activeDivisionTab) activeDivisionTab = playerDiv;

  const clubsInActiveDiv = [...(leagueEngine.divisions[activeDivisionTab] || [])];
  
  // Sort clubs by prelimLeaguePoints desc, then prelimTotalPoints
  clubsInActiveDiv.sort((a, b) => {
    if (leagueEngine.phase === 'season_ended' || leagueEngine.phase === 'final_phase') {
      return (b.finalLeaguePoints - a.finalLeaguePoints) || (b.finalTotalPoints - a.finalTotalPoints);
    }
    return (b.prelimLeaguePoints - a.prelimLeaguePoints) || (b.prelimTotalPoints - a.prelimTotalPoints);
  });

  // Top Swimmers in League (Trofeos Leopoldo Bremón)
  const allSwimmers = [];
  Object.values(leagueEngine.divisions).forEach(clubs => {
    clubs.forEach(c => {
      c.swimmers.forEach(s => {
        allSwimmers.push({ swimmer: s, clubName: c.name, division: c.division });
      });
    });
  });

  const topMaleSwimmers = allSwimmers.filter(x => x.swimmer.gender === 'M').sort((a, b) => b.swimmer.seasonPoints - a.swimmer.seasonPoints).slice(0, 5);
  const topFemaleSwimmers = allSwimmers.filter(x => x.swimmer.gender === 'F').sort((a, b) => b.swimmer.seasonPoints - a.swimmer.seasonPoints).slice(0, 5);

  return `
    <div class="space-y-6">
      <!-- Divisions Selector Tabs -->
      <div class="glass-card p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="text-xs uppercase tracking-wider text-slate-400 font-semibold mr-2">División:</span>
          <div class="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700/80">
            ${[DIVISIONS.HONRA, DIVISIONS.DIV1, DIVISIONS.DIV2, DIVISIONS.DIV3].map(d => `
              <button class="px-3.5 py-1.5 rounded-lg text-xs font-semibold tab-division-btn ${activeDivisionTab === d ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}" data-division="${d}">
                ${d} ${playerDiv === d ? '★' : ''}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="text-xs text-slate-400">
          Fase actual: <span class="badge badge-warning text-[11px]">${leagueEngine.phase.toUpperCase()}</span>
        </div>
      </div>

      <!-- Main Division Table -->
      <div class="glass-card rounded-2xl overflow-hidden border border-slate-700/60">
        <div class="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <span>🏊</span> Clasificación Oficial - ${activeDivisionTab}
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">Normativa FEGAN Circular 26-14: Postos de ascenso, permanencia e descenso</p>
          </div>
          <div class="flex items-center gap-3 text-xs">
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-emerald-500/80 inline-block"></span> Ascenso / Título (Top 2)</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-rose-500/80 inline-block"></span> Descenso (Últimos 2)</span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <th class="py-3 px-4">Posto</th>
                <th class="py-3 px-4">Club de Natación</th>
                <th class="py-3 px-3">Cidade</th>
                <th class="py-3 px-3 text-center">Xornada 1</th>
                <th class="py-3 px-3 text-center">Xornada 2</th>
                <th class="py-3 px-3 text-center">Xornada 3</th>
                <th class="py-3 px-3 text-center text-cyan-300 font-bold">Pts Liga</th>
                <th class="py-3 px-3 text-center text-slate-300">Pts Probas</th>
                <th class="py-3 px-4 text-right">Destino Tempada</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              ${clubsInActiveDiv.map((club, idx) => {
                const isPlayer = club.isPlayer;
                const isPromo = idx <= 1;
                const isReleg = idx >= clubsInActiveDiv.length - 2;

                let rowBg = 'hover:bg-slate-800/30';
                if (isPlayer) rowBg = 'bg-cyan-950/40 font-semibold text-cyan-200';

                return `
                  <tr class="${rowBg} transition-colors">
                    <td class="py-3.5 px-4 font-mono font-bold ${isPromo ? 'text-emerald-400' : isReleg ? 'text-rose-400' : 'text-slate-300'}">
                      #${idx + 1}
                    </td>
                    <td class="py-3.5 px-4 flex items-center gap-2.5">
                      <span class="w-3.5 h-3.5 rounded-full shadow-sm" style="background-color: ${club.primaryColor};"></span>
                      <span class="font-bold text-white">${club.name}</span>
                      ${isPlayer ? '<span class="badge badge-primary text-[10px] ml-1">O teu Club</span>' : ''}
                    </td>
                    <td class="py-3.5 px-3 text-slate-400">${club.city}</td>
                    <td class="py-3.5 px-3 text-center font-mono text-slate-300">${club.xornadaPlacements[0] ? `#${club.xornadaPlacements[0]}` : '-'}</td>
                    <td class="py-3.5 px-3 text-center font-mono text-slate-300">${club.xornadaPlacements[1] ? `#${club.xornadaPlacements[1]}` : '-'}</td>
                    <td class="py-3.5 px-3 text-center font-mono text-slate-300">${club.xornadaPlacements[2] ? `#${club.xornadaPlacements[2]}` : '-'}</td>
                    <td class="py-3.5 px-3 text-center font-mono font-black text-sm text-cyan-400">${club.prelimLeaguePoints}</td>
                    <td class="py-3.5 px-3 text-center font-mono text-slate-300">${club.prelimTotalPoints}</td>
                    <td class="py-3.5 px-4 text-right">
                      ${isPromo ? '<span class="badge badge-success text-[10px]">Zona de Ascenso ⬆️</span>' :
                        isReleg ? '<span class="badge badge-danger text-[10px]">Zona de Descenso ⬇️</span>' :
                        '<span class="badge badge-primary text-[10px]">Permanencia</span>'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Trofeos Presidente Leopoldo Bremón (Best Swimmers) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Male Trophy Leaderboard -->
        <div class="glass-card p-5 rounded-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <h4 class="font-bold text-white text-sm flex items-center gap-2">
              <span>🥇</span> Trofeo Leopoldo Bremón (Masculino)
            </h4>
            <span class="text-xs text-amber-400 font-semibold">Puntos WAQ / Liga</span>
          </div>
          <div class="space-y-2">
            ${topMaleSwimmers.map((entry, i) => `
              <div class="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 text-xs">
                <div class="flex items-center gap-2.5">
                  <span class="font-mono font-bold ${i === 0 ? 'text-amber-400' : 'text-slate-400'}">#${i + 1}</span>
                  <div>
                    <div class="font-bold text-white">${entry.swimmer.fullName}</div>
                    <div class="text-[11px] text-slate-400">${entry.clubName} (${entry.division})</div>
                  </div>
                </div>
                <div class="text-right font-mono font-bold text-cyan-300">${entry.swimmer.seasonPoints} pts</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Female Trophy Leaderboard -->
        <div class="glass-card p-5 rounded-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <h4 class="font-bold text-white text-sm flex items-center gap-2">
              <span>🥇</span> Trofeo Leopoldo Bremón (Feminino)
            </h4>
            <span class="text-xs text-amber-400 font-semibold">Puntos WAQ / Liga</span>
          </div>
          <div class="space-y-2">
            ${topFemaleSwimmers.map((entry, i) => `
              <div class="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 text-xs">
                <div class="flex items-center gap-2.5">
                  <span class="font-mono font-bold ${i === 0 ? 'text-amber-400' : 'text-slate-400'}">#${i + 1}</span>
                  <div>
                    <div class="font-bold text-white">${entry.swimmer.fullName}</div>
                    <div class="text-[11px] text-slate-400">${entry.clubName} (${entry.division})</div>
                  </div>
                </div>
                <div class="text-right font-mono font-bold text-cyan-300">${entry.swimmer.seasonPoints} pts</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function setupStandingsEvents(container) {
  container.querySelectorAll('.tab-division-btn').forEach(btn => {
    btn.onclick = () => {
      activeDivisionTab = btn.getAttribute('data-division');
      gameState.triggerUIUpdate();
    };
  });
}
