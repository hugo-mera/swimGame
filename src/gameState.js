// Game State Management & Persistence
import { DIFFICULTY_PRESETS, DIVISIONS } from './constants.js';
import { LeagueEngine } from './engine/league.js';
import { Club } from './models/Club.js';
import { Swimmer } from './models/Swimmer.js';

class GameState {
  constructor() {
    this.difficulty = DIFFICULTY_PRESETS.NORMAL;
    this.leagueEngine = null;
    this.activeTab = 'dashboard';
    this.notifications = [];
    this.isGameStarted = false;

    // Active meet execution state
    this.activeMeet = {
      inProgress: false,
      divisionName: null,
      meetProgram: null,
      isFinalPhase: false,
      currentEventIdx: 0,
      currentEventResults: null,
      meetHistory: [],
      isSimulating: false,
      simSpeed: 1.0,
      elapsedSeconds: 0,
      scratchRoomOpen: false,
      meetKey: null
    };
  }

  startNewGame({
    clubName = 'CN Riazor',
    city = 'A Coruña',
    primaryColor = '#0ea5e9',
    secondaryColor = '#ffffff',
    difficultyKey = 'NORMAL'
  }) {
    this.difficulty = DIFFICULTY_PRESETS[difficultyKey] || DIFFICULTY_PRESETS.NORMAL;
    this.leagueEngine = new LeagueEngine(this.difficulty);
    this.leagueEngine.initializeClubs({
      name: clubName,
      city,
      primaryColor,
      secondaryColor
    });

    this.isGameStarted = true;
    this.activeTab = 'dashboard';
    this.notify(`Benvido á Liga Galega de Clubs! Club ${clubName} rexistrado en 3ª División.`, 'success');
    this.saveToLocalStorage();
  }

  notify(message, type = 'info') {
    const id = Date.now() + Math.random();
    this.notifications.push({ id, message, type });
    if (this.notifications.length > 5) this.notifications.shift();

    // Auto-remove after 4.5s
    setTimeout(() => {
      this.notifications = this.notifications.filter(n => n.id !== id);
      this.triggerNotificationUpdate();
    }, 4500);

    this.triggerNotificationUpdate();
  }

  triggerNotificationUpdate() {
    if (typeof window !== 'undefined' && window.__refreshNotifications) {
      window.__refreshNotifications();
    }
  }

  triggerUIUpdate() {
    if (window.__refreshGameUI) {
      window.__refreshGameUI();
    }
  }

  saveToLocalStorage() {
    try {
      const serialized = this.serialize();
      localStorage.setItem('swimGameSaveData_v1', JSON.stringify(serialized));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  loadFromLocalStorage() {
    try {
      const dataStr = localStorage.getItem('swimGameSaveData_v1');
      if (!dataStr) return false;
      const data = JSON.parse(dataStr);
      return this.deserialize(data);
    } catch (e) {
      console.error('Failed to load save data:', e);
      return false;
    }
  }

  exportSaveFile() {
    const data = this.serialize();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swim_game_save_tempada_${this.leagueEngine.currentSeasonYear}_sem_${this.leagueEngine.currentWeek}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importSaveFile(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      const success = this.deserialize(data);
      if (success) {
        this.notify('Partida cargada correctamente!', 'success');
        this.saveToLocalStorage();
        this.triggerUIUpdate();
      }
      return success;
    } catch (e) {
      this.notify('Erro ao importar o arquivo de gardado.', 'error');
      return false;
    }
  }

  serialize() {
    if (!this.leagueEngine) return null;

    return {
      version: 1,
      difficulty: this.difficulty,
      currentWeek: this.leagueEngine.currentWeek,
      currentSeasonYear: this.leagueEngine.currentSeasonYear,
      phase: this.leagueEngine.phase,
      divisions: Object.fromEntries(
        Object.entries(this.leagueEngine.divisions).map(([divName, clubs]) => [
          divName,
          clubs.map(c => ({
            id: c.id,
            name: c.name,
            city: c.city,
            division: c.division,
            isPlayer: c.isPlayer,
            primaryColor: c.primaryColor,
            secondaryColor: c.secondaryColor,
            funds: c.funds,
            reputation: c.reputation,
            equipment: c.equipment,
            sponsors: c.sponsors,
            trainingGroups: c.trainingGroups,
            customWeeklyPhases: c.customWeeklyPhases,
            prelimEventsSwum: c.prelimEventsSwum,
            finalEventsSwum: c.finalEventsSwum,
            currentMeetEntries: c.currentMeetEntries,
            meetEntriesSubmittedFor: c.meetEntriesSubmittedFor,
            meetReserves: c.meetReserves,
            prelimTotalPoints: c.prelimTotalPoints,
            prelimLeaguePoints: c.prelimLeaguePoints,
            finalTotalPoints: c.finalTotalPoints,
            finalLeaguePoints: c.finalLeaguePoints,
            xornadaPlacements: c.xornadaPlacements,
            trophies: c.trophies,
            swimmers: c.swimmers.map(s => ({
              id: s.id,
              firstName: s.firstName,
              lastName: s.lastName,
              gender: s.gender,
              age: s.age,
              clubId: s.clubId,
              trainingGroupId: s.trainingGroupId,
              primaryStroke: s.primaryStroke,
              specialty: s.specialty,
              stats: s.stats,
              chronicFatigue: s.chronicFatigue,
              acuteFatigue: s.acuteFatigue,
              morale: s.morale,
              salary: s.salary,
              personalBests: s.personalBests,
              seasonPoints: s.seasonPoints,
              racesCount: s.racesCount,
              winsCount: s.winsCount,
              lastStatChanges: s.lastStatChanges
            }))
          }))
        ])
      ),
      marketSwimmers: this.leagueEngine.marketSwimmers.map(s => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        gender: s.gender,
        age: s.age,
        primaryStroke: s.primaryStroke,
        specialty: s.specialty,
        stats: s.stats,
        salary: s.salary
      }))
    };
  }

  deserialize(data) {
    if (!data || !data.divisions) return false;

    this.difficulty = data.difficulty || DIFFICULTY_PRESETS.NORMAL;
    this.leagueEngine = new LeagueEngine(this.difficulty);
    this.leagueEngine.currentWeek = data.currentWeek || 1;
    this.leagueEngine.currentSeasonYear = data.currentSeasonYear || 2026;
    this.leagueEngine.phase = data.phase || 'preliminary';

    this.leagueEngine.divisions = {};

    Object.entries(data.divisions).forEach(([divName, clubList]) => {
      this.leagueEngine.divisions[divName] = clubList.map(cData => {
        const club = new Club(cData);
        club.swimmers = [];
        if (cData.swimmers) {
          cData.swimmers.forEach(sData => {
            club.addSwimmer(new Swimmer(sData));
          });
        }
        if (club.isPlayer) {
          this.leagueEngine.playerClub = club;
        }
        return club;
      });
    });

    if (data.marketSwimmers) {
      this.leagueEngine.marketSwimmers = data.marketSwimmers.map(sData => new Swimmer(sData));
    }

    this.isGameStarted = true;
    return true;
  }
}

export const gameState = new GameState();
