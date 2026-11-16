// Facilities & Equipment UI View - Club Upgrades & Training Gear
import { gameState } from '../gameState.js';
import { EQUIPMENT_CATALOG } from '../constants.js';

export function renderFacilities() {
  const { leagueEngine } = gameState;
  const club = leagueEngine.playerClub;

  const trainingBonus = Math.round(club.getEquipmentTrainingBonus() * 100);
  const recoveryBonus = Math.round(club.getEquipmentRecoveryBonus() * 100);
  const startBonus = club.getEquipmentRaceStartBonus();

  return `
    <div class="space-y-6">
      <!-- Top Banner -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl">
        <div>
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span>🏋️‍♂️</span> Instalacións & Material de Adestramento
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">Inviste os ingresos do club en material de alto rendemento para mellorar o adestramento</p>
        </div>

        <div class="flex items-center gap-6">
          <div>
            <span class="text-xs text-slate-400 block uppercase font-semibold">Orzamento do Club</span>
            <div class="text-2xl font-black text-emerald-400 font-mono">${club.funds.toLocaleString()} €</div>
          </div>
          <div class="text-right">
            <span class="text-xs text-slate-400 block uppercase font-semibold">Bonificación Total</span>
            <div class="text-sm font-bold text-cyan-300 font-mono">+${trainingBonus}% adestr. / +${recoveryBonus}% recup.</div>
          </div>
        </div>
      </div>

      <!-- Equipment Catalog Grid -->
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
  `;
}

export function setupFacilitiesEvents(container) {
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
}
