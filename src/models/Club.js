// Club Model - Represents a swimming team in the Galician League
import { PARTICIPATION_LIMITS, EQUIPMENT_CATALOG, DIVISIONS, RELAY_EVENT_IDS } from '../constants.js';

export class Club {
  constructor(data = {}) {
    this.id = data.id || `club_${Date.now()}`;
    this.name = data.name || 'Club Natación';
    this.city = data.city || 'Galicia';
    this.division = data.division || DIVISIONS.DIV3;
    this.isPlayer = data.isPlayer || false;
    this.primaryColor = data.primaryColor || '#0284c7';
    this.secondaryColor = data.secondaryColor || '#ffffff';
    this.funds = data.funds ?? 10000;
    this.reputation = data.reputation || 50;

    // Owned Equipment / Facilities IDs
    this.equipment = data.equipment || ['pull_kick'];

    // Active Sponsors generating weekly revenue
    this.sponsors = data.sponsors || this.getDefaultSponsors();

    // Swimmers
    this.swimmers = []; // populated via addSwimmer

    // Training Groups Configuration
    this.trainingGroups = data.trainingGroups || {
      group_sprint: {
        id: 'group_sprint',
        name: 'Velocistas (50m - 100m)',
        focusStroke: 'freestyle',
        volumeLevel: 'medium',
        intensityMix: { aerobic: 30, threshold: 30, sprint: 40 },
        gymFocus: 'explosive'
      },
      group_distance: {
        id: 'group_distance',
        name: 'Fondistas (200m - 1500m)',
        focusStroke: 'freestyle',
        volumeLevel: 'high',
        intensityMix: { aerobic: 60, threshold: 25, sprint: 15 },
        gymFocus: 'endurance'
      },
      group_strokes: {
        id: 'group_strokes',
        name: 'Estilistas & Estilos Puros',
        focusStroke: 'IM',
        volumeLevel: 'medium',
        intensityMix: { aerobic: 40, threshold: 35, sprint: 25 },
        gymFocus: 'strength'
      },
      default: {
        id: 'default',
        name: 'Grupo Xeral de Club',
        focusStroke: 'balanced',
        volumeLevel: 'medium',
        intensityMix: { aerobic: 45, threshold: 35, sprint: 20 },
        gymFocus: 'general'
      }
    };

    // Custom coach periodization schedule (weekNum -> phaseKey)
    this.customWeeklyPhases = data.customWeeklyPhases || {};

    // Tracking participation across the season according to Circular 26-14:
    // prelimEventsSwum: { [swimmerId]: count } (Max 6 in preliminary phase)
    this.prelimEventsSwum = data.prelimEventsSwum || {};
    // finalEventsSwum: { [swimmerId]: count } (Max 4 in final phase)
    this.finalEventsSwum = data.finalEventsSwum || {};

    // Current Meet Entries: eventId -> array of swimmerIds (or relay team objects)
    this.currentMeetEntries = data.currentMeetEntries || {};
    // Reserves registered for the meet (Circular Page 2 section 3.8 - up to 10 reserves)
    this.meetReserves = data.meetReserves || [];

    // League standings tracking
    this.prelimTotalPoints = data.prelimTotalPoints || 0; // Total swim event points
    this.prelimLeaguePoints = data.prelimLeaguePoints || 0; // 7,5,4,3,2,1 xornada points
    this.finalTotalPoints = data.finalTotalPoints || 0;
    this.finalLeaguePoints = data.finalLeaguePoints || 0;
    this.xornadaPlacements = data.xornadaPlacements || []; // history of finishes: [1, 2, 1]
    this.trophies = data.trophies || [];
  }

  addSwimmer(swimmer) {
    swimmer.clubId = this.id;
    this.swimmers.push(swimmer);
  }

  removeSwimmer(swimmerId) {
    const idx = this.swimmers.findIndex(s => s.id === swimmerId);
    if (idx !== -1) {
      const swimmer = this.swimmers[idx];
      swimmer.clubId = null;
      this.swimmers.splice(idx, 1);
      return swimmer;
    }
    return null;
  }

  getSwimmer(swimmerId) {
    return this.swimmers.find(s => s.id === swimmerId) || null;
  }

  get maleSwimmers() {
    return this.swimmers.filter(s => s.gender === 'M');
  }

  get femaleSwimmers() {
    return this.swimmers.filter(s => s.gender === 'F');
  }

  hasEquipment(equipmentId) {
    return this.equipment.includes(equipmentId);
  }

  buyEquipment(equipmentId) {
    const item = EQUIPMENT_CATALOG.find(eq => eq.id === equipmentId);
    if (!item) return { success: false, reason: 'Equipamento non atopado' };
    if (this.hasEquipment(equipmentId)) return { success: false, reason: 'Xa posúes este equipamento' };
    if (this.funds < item.cost) return { success: false, reason: 'Fondos insuficientes' };

    this.funds -= item.cost;
    this.equipment.push(equipmentId);
    return { success: true, item };
  }

  getEquipmentTrainingBonus() {
    let bonus = 0;
    this.equipment.forEach(eqId => {
      const item = EQUIPMENT_CATALOG.find(e => e.id === eqId);
      if (item && item.trainingBonus) bonus += item.trainingBonus;
    });
    return bonus;
  }

  getEquipmentRecoveryBonus() {
    let bonus = 0;
    this.equipment.forEach(eqId => {
      const item = EQUIPMENT_CATALOG.find(e => e.id === eqId);
      if (item && item.fatigueRecoveryBonus) bonus += item.fatigueRecoveryBonus;
    });
    return bonus;
  }

  getEquipmentRaceStartBonus() {
    let bonus = 0;
    this.equipment.forEach(eqId => {
      const item = EQUIPMENT_CATALOG.find(e => e.id === eqId);
      if (item && item.raceStartBonus) bonus += item.raceStartBonus;
    });
    return bonus;
  }

  setWeeklyPhase(weekNum, phaseId) {
    this.customWeeklyPhases[weekNum] = phaseId.toLowerCase();
  }

  setBatchWeeklyPhases(fromWeek, toWeek, phaseId) {
    const start = Math.max(1, Math.min(fromWeek, toWeek));
    const end = Math.min(36, Math.max(fromWeek, toWeek));
    for (let w = start; w <= end; w++) {
      this.customWeeklyPhases[w] = phaseId.toLowerCase();
    }
  }

  resetWeeklyPhases() {
    this.customWeeklyPhases = {};
  }

  setupAutoMeetTapers(schedule) {
    schedule.forEach(event => {
      if ((event.type === 'meet' || event.type === 'final_meet') && event.week > 1) {
        // Schedule Taper/Descarga on the week prior to the meet
        this.setWeeklyPhase(event.week - 1, 'taper');
      }
    });
  }

  getDefaultSponsors() {
    return [
      {
        id: 'sp_concello',
        name: 'Concello e Deputación (Subvención ao Deporte Base)',
        category: 'Institucional',
        weeklyIncome: 350,
        icon: '🏛️',
        description: 'Apoio municipal para o fomento da natación de base e canteira galega.'
      },
      {
        id: 'sp_local_business',
        name: 'Comercio Local & Clínicas de Fisioterapia',
        category: 'Comercial',
        weeklyIncome: 180,
        icon: '🏪',
        description: 'Patrocinador local de proximidade que colabora co club.'
      }
    ];
  }

  calculateWeeklySponsorshipIncome() {
    return (this.sponsors || []).reduce((acc, sp) => acc + (sp.weeklyIncome || 0), 0);
  }

  calculateWeeklySalaries() {
    return this.swimmers.reduce((acc, s) => acc + (s.salary || 15), 0);
  }

  calculateFacilityMaintenance() {
    return Math.round(this.equipment.length * 10);
  }

  calculateTotalWeeklyExpenses() {
    return this.calculateWeeklySalaries() + this.calculateFacilityMaintenance();
  }

  /**
   * Validates if a swimmer can be entered into an event under FEGAN Circular 26-14 rules
   * Returns: { valid: boolean, reason: string | null }
   */
  validateSwimmerEntry(swimmer, event, isFinalPhase = false, currentEntries = this.currentMeetEntries) {
    if (!swimmer) return { valid: false, reason: 'Nadador inexistente' };

    // 1. Gender check
    if (!event.isRelay) {
      if (event.gender !== swimmer.gender) {
        return { valid: false, reason: `Esta proba é da categoría ${event.gender === 'M' ? 'Masculina' : 'Feminina'}` };
      }
    }

    // 2. Event capacity check (Max 2 swimmers per club per individual event)
    const existingInEvent = currentEntries[event.id] || [];
    if (!event.isRelay && existingInEvent.includes(swimmer.id)) {
      return { valid: true }; // Already entered
    }

    if (!event.isRelay) {
      // 3ª División prelim restriction on 400m, 800m, 1500m (Circular section 3.4)
      const isLongDist = [400, 800, 1500].includes(event.distance);
      const isDiv3Prelim = !isFinalPhase && this.division === DIVISIONS.DIV3;
      const maxAllowedInEvent = isDiv3Prelim && isLongDist ? 1 : PARTICIPATION_LIMITS.MAX_SWIMMERS_PER_EVENT_PER_CLUB;

      if (existingInEvent.length >= maxAllowedInEvent) {
        return { valid: false, reason: `O club xa ten o máximo de ${maxAllowedInEvent} nadador(es) inscritos nesta proba` };
      }

      // 3. Session limit check: Max 2 individual events per swimmer in this meet / session
      let individualEventsInCurrentMeet = 0;
      Object.entries(currentEntries).forEach(([evId, enteredList]) => {
        // Exclude relays (FEGAN Circular 26-14: relays do not count towards individual limits)
        if (RELAY_EVENT_IDS.has(evId)) return;
        if (Array.isArray(enteredList) && enteredList.includes(swimmer.id)) {
          individualEventsInCurrentMeet++;
        }
      });

      if (individualEventsInCurrentMeet >= PARTICIPATION_LIMITS.MAX_INDIVIDUAL_PER_SESSION) {
        return { valid: false, reason: `${swimmer.fullName} xa alcanzou o límite de 2 probas individuais nesta xornada/sesión` };
      }

      // 4. Phase total limit check
      if (!isFinalPhase) {
        const swumSoFar = this.prelimEventsSwum[swimmer.id] || 0;
        if (swumSoFar + 1 > PARTICIPATION_LIMITS.MAX_INDIVIDUAL_PRELIM_TOTAL) {
          return { valid: false, reason: `${swimmer.fullName} supera o tope regulamentario de 6 probas individuais na Fase Previa` };
        }
      } else {
        const swumSoFar = this.finalEventsSwum[swimmer.id] || 0;
        if (swumSoFar + 1 > PARTICIPATION_LIMITS.MAX_INDIVIDUAL_FINAL_TOTAL) {
          return { valid: false, reason: `${swimmer.fullName} supera o tope regulamentario de 4 probas individuais na Fase Final` };
        }
      }
    }

    return { valid: true, reason: null };
  }

  recordMeetParticipation(isFinalPhase = false) {
    Object.entries(this.currentMeetEntries).forEach(([eventId, swimmerIds]) => {
      // Don't count relays in individual limits (Circular 26-14)
      if (RELAY_EVENT_IDS.has(eventId)) return;
      if (Array.isArray(swimmerIds)) {
        swimmerIds.forEach(sId => {
          if (!sId) return;
          if (!isFinalPhase) {
            this.prelimEventsSwum[sId] = (this.prelimEventsSwum[sId] || 0) + 1;
          } else {
            this.finalEventsSwum[sId] = (this.finalEventsSwum[sId] || 0) + 1;
          }
        });
      }
    });
  }

  clearMeetEntries() {
    this.currentMeetEntries = {};
  }
}
