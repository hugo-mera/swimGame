// Facilities & Equipment UI View - Club Upgrades & Training Gear
import { gameState } from '../gameState.js';
import { EQUIPMENT_CATALOG, AVAILABLE_SPONSORS } from '../constants.js';

export function renderFacilities() {
  const { leagueEngine } = gameState;
  const club = leagueEngine.playerClub;

  const trainingBonus = Math.round(club.getEquipmentTrainingBonus() * 100);
  const recoveryBonus = Math.round(club.getEquipmentRecoveryBonus() * 100);
  const weeklySponsorsTotal = club.calculateWeeklySponsorshipIncome();

  const activeSponsorIds = new Set((club.sponsors || []).map(s => s.id));
  const availableToSign = AVAILABLE_SPONSORS.filter(s => !activeSponsorIds.has(s.id));

  return `
    <div class="space-y-8">
      <!-- Top Banner -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl">
        <div>
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span>🏋️‍♂️</span> Instalacións, Material & Patrocinios
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">Xestiona as fontes de ingresos por patrocinio e inviste en equipamento de alto rendemento</p>
        </div>

        <div class="flex items-center gap-6">
          <div>
            <span class="text-xs text-slate-400 block uppercase font-semibold">Orzamento do Club</span>
            <div class="text-2xl font-mono ${club.funds < 0 ? 'text-rose-500 font-black' : 'text-emerald-400 font-black'}">
              ${club.funds.toLocaleString()} € ${club.funds < 0 ? '<span class="text-xs text-rose-400 font-sans block">⚠️ DÉBEDA</span>' : ''}
            </div>
          </div>
          <div class="text-right">
            <span class="text-xs text-slate-400 block uppercase font-semibold">Ingresos Patrocinadores</span>
            <div class="text-base font-bold text-emerald-400 font-mono">+${weeklySponsorsTotal.toLocaleString()} € / semana</div>
          </div>
        </div>
      </div>

      <!-- Sponsors Section -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <span>🤝</span> Patrocinadores Oficiais do Club
            </h3>
            <p class="text-xs text-slate-400">Os patrocinadores inxectan ingresos fixos todas as semanas nas arcas do club</p>
          </div>
          <span class="badge badge-success text-xs font-mono font-bold">+${weeklySponsorsTotal} € / semana</span>
        </div>

        <!-- Active Sponsors Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${(club.sponsors || []).map(sp => `
            <div class="glass-card p-4 rounded-xl border border-emerald-500/50 bg-emerald-950/15 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-2xl">${sp.icon || '🤝'}</span>
                  <span class="badge badge-success text-[10px]">Contrato Activo ✅</span>
                </div>
                <h4 class="font-bold text-white text-sm">${sp.name}</h4>
                <p class="text-xs text-slate-300 mt-1">${sp.description}</p>
              </div>
              <div class="mt-4 pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span class="text-slate-400">Ingreso semanal:</span>
                <span class="font-bold font-mono text-emerald-400">+${sp.weeklyIncome.toLocaleString()} € / sem</span>
              </div>
            </div>
          `).join('')}

          <!-- Available Sponsors to Sign -->
          ${availableToSign.map(sp => {
            const meetsReputation = club.reputation >= sp.minReputation;

            return `
              <div class="glass-card p-4 rounded-xl border ${meetsReputation ? 'border-cyan-500/50 bg-cyan-950/10' : 'border-slate-800 opacity-60'} flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-2xl">${sp.icon}</span>
                    <span class="badge ${meetsReputation ? 'badge-primary' : 'badge-danger'} text-[10px]">
                      ${meetsReputation ? 'Dispoñible para asinar' : `Req: Reputación ${sp.minReputation}`}
                    </span>
                  </div>
                  <h4 class="font-bold text-white text-sm">${sp.name}</h4>
                  <p class="text-xs text-slate-400 mt-1">${sp.description}</p>
                </div>
                <div class="mt-4 pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <span class="text-slate-400 block text-[10px]">Aporte:</span>
                    <span class="font-bold font-mono text-emerald-400">+${sp.weeklyIncome.toLocaleString()} €/sem</span>
                  </div>
                  <button class="btn btn-xs ${meetsReputation ? 'btn-primary' : 'btn-outline opacity-40 cursor-not-allowed'} btn-sign-sponsor" data-id="${sp.id}" ${!meetsReputation ? 'disabled' : ''}>
                    Asinar Contrato ✍️
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Equipment Catalog Grid -->
      <div class="space-y-4">
        <div>
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <span>📦</span> Catálogo de Material & Instalacións
          </h3>
          <p class="text-xs text-slate-400">Bonificacións acumulables de rendemento para o adestramento e competición</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${EQUIPMENT_CATALOG.map(item => {
            const isOwned = club.hasEquipment(item.id);
            const canAfford = club.funds >= item.cost;

            return `
              <div class="glass-card p-5 rounded-2xl flex flex-col justify-between border ${isOwned ? 'border-emerald-500/60 bg-emerald-950/10' : 'border-slate-700/60'}">
                <div>
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-3xl">${item.icon}</span>
                    <span class="badge ${isOwned ? 'badge-success' : 'badge-primary'} text-xs">
                      ${isOwned ? 'En Propiedade ✅' : item.category}
                    </span>
                  </div>

                  <h3 class="font-bold text-white text-base">${item.name}</h3>
                  <p class="text-xs text-cyan-300/80 font-medium mt-0.5">${item.subtitle}</p>
                  <p class="text-xs text-slate-300 mt-2.5 leading-relaxed">${item.description}</p>
                </div>

                <div class="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Prezo de Compra</span>
                    <div class="text-lg font-black ${isOwned ? 'text-slate-400' : canAfford ? 'text-emerald-400' : 'text-rose-400'} font-mono">
                      ${item.cost.toLocaleString()} €
                    </div>
                  </div>

                  <button class="btn btn-sm ${isOwned ? 'btn-outline opacity-40 cursor-default' : canAfford ? 'btn-primary' : 'btn-outline opacity-50 cursor-not-allowed'} btn-buy-equipment" data-id="${item.id}" ${isOwned || !canAfford ? 'disabled' : ''}>
                    ${isOwned ? 'Adquirido' : 'Mercar Mellora'}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

export function setupFacilitiesEvents(container) {
  // Buy equipment
  container.querySelectorAll('.btn-buy-equipment').forEach(btn => {
    btn.onclick = () => {
      const eqId = btn.getAttribute('data-id');
      const club = gameState.leagueEngine.playerClub;
      const res = club.buyEquipment(eqId);

      if (res.success) {
        gameState.notify(`Adquirido con éxito: ${res.item.name}!`, 'success');
        gameState.saveToLocalStorage();
        gameState.triggerUIUpdate();
      } else {
        gameState.notify(res.reason, 'error');
      }
    };
  });

  // Sign sponsor
  container.querySelectorAll('.btn-sign-sponsor').forEach(btn => {
    btn.onclick = () => {
      const sponsorId = btn.getAttribute('data-id');
      const sponsor = AVAILABLE_SPONSORS.find(s => s.id === sponsorId);
      const club = gameState.leagueEngine.playerClub;
      if (!sponsor) return;

      if (club.reputation < sponsor.minReputation) {
        gameState.notify(`Necesitas un mínimo de ${sponsor.minReputation} de reputación para asinar con ${sponsor.name}.`, 'error');
        return;
      }

      if (!club.sponsors) club.sponsors = [];
      club.sponsors.push(sponsor);
      gameState.notify(`¡Contrato asinado con ${sponsor.name}! +${sponsor.weeklyIncome} € semanais.`, 'success');
      gameState.saveToLocalStorage();
      gameState.triggerUIUpdate();
    };
  });
}
