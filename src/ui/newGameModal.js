// New Game & Difficulty Selection Modal
import { gameState } from '../gameState.js';
import { DIFFICULTY_PRESETS } from '../constants.js';

export function renderNewGameModal() {
  return `
    <div id="new-game-modal-backdrop" class="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div class="glass-card bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl space-y-6 animate-in fade-in">
        <div class="text-center space-y-2">
          <div class="text-4xl">🏊‍♂️🏆</div>
          <h2 class="text-2xl md:text-3xl font-black text-white tracking-tight">Liga Galega de Clubs de Natación</h2>
          <p class="text-xs text-slate-300 max-w-md mx-auto">
            Xestor oficial baseado na normativa FEGAN. Comezas na 3ª División co obxectivo de ascender ata a División de Honra!
          </p>
        </div>

        <form id="new-game-form" class="space-y-5">
          <!-- Club Name & City -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Nome do Club</label>
              <input type="text" id="input-club-name" required value="CN Riazor" class="bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Sede / Cidade</label>
              <input type="text" id="input-club-city" required value="A Coruña" class="bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500">
            </div>
          </div>

          <!-- Color Customizer -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Cor Principal do Gorro e Equipamento</label>
            <div class="flex items-center gap-3">
              <input type="color" id="input-club-color" value="#0284c7" class="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0">
              <span class="text-xs text-slate-400">Escolle a cor que vestirán os teus nadadores na piscina</span>
            </div>
          </div>

          <!-- Difficulty Presets -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Nivel de Dificultade</label>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              ${Object.values(DIFFICULTY_PRESETS).map((diff, idx) => `
                <label class="cursor-pointer block">
                  <input type="radio" name="difficulty" value="${diff.id}" ${diff.id === 'NORMAL' ? 'checked' : ''} class="peer sr-only">
                  <div class="p-4 rounded-2xl border border-slate-700/80 bg-slate-800/40 peer-checked:border-cyan-500 peer-checked:bg-cyan-950/30 peer-checked:ring-1 peer-checked:ring-cyan-500 transition-all text-left h-full flex flex-col justify-between">
                    <div>
                      <div class="font-bold text-white text-sm mb-1">${diff.name}</div>
                      <p class="text-[11px] text-slate-400 leading-snug">${diff.description}</p>
                    </div>
                    <div class="mt-3 pt-2 border-t border-slate-700/50 text-[10px] text-slate-300 font-mono">
                      Orzamento: <strong class="text-emerald-400">${diff.startingFunds.toLocaleString()} €</strong>
                    </div>
                  </div>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="pt-2">
            <button type="submit" class="btn btn-primary w-full py-3.5 text-sm font-bold shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2">
              <span>🚀</span> Comezar Tempada na 3ª División
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function setupNewGameEvents(container) {
  const form = container.querySelector('#new-game-form');
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const clubName = container.querySelector('#input-club-name').value.trim() || 'CN Riazor';
      const city = container.querySelector('#input-club-city').value.trim() || 'A Coruña';
      const primaryColor = container.querySelector('#input-club-color').value || '#0284c7';
      const diffKey = container.querySelector('input[name="difficulty"]:checked').value || 'NORMAL';

      gameState.startNewGame({
        clubName,
        city,
        primaryColor,
        difficultyKey: diffKey
      });

      gameState.triggerUIUpdate();
    };
  }
}
