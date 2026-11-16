// League & Season Management Engine
// Implements Galician Swimming Federation (FEGAN) Circular 26-14 Competition Regulations
import {
  DIVISIONS,
  DIVISION_ORDER,
  INITIAL_CLUBS,
  MEET_PROGRAMS,
  SCORING_RULES,
  PERIODIZATION_PHASES,
  STAT_KEYS,
  STROKES,
  PRIZE_MONEY
} from '../constants.js';
import { Club } from '../models/Club.js';
import { Swimmer } from '../models/Swimmer.js';
import { AICoach } from './ai.js';
import { RaceSimulation } from './simulation.js';

export class LeagueEngine {
  constructor(difficultyConfig) {
    this.difficulty = difficultyConfig;
    this.currentWeek = 1;
    this.currentSeasonYear = 2026;
    this.totalWeeks = 36;
    this.phase = 'preliminary'; // 'preliminary', 'post_prelim_split', 'final_phase', 'season_ended'

    // Map: divisionName -> Array of Club instances
    this.divisions = {};
    // Store user's club reference
    this.playerClub = null;

    // Calendar schedule
    this.schedule = this.buildSeasonSchedule();

    // Market pool
    this.marketSwimmers = [];

    // History & Records
    this.seasonHistory = [];
  }

  /**
   * Initializes all 4 Galician divisions with realistic club rosters
   */
  initializeClubs(playerClubConfig = { name: 'CN Riazor', city: 'A Coruña', primaryColor: '#0284c7', secondaryColor: '#ffffff' }) {
    // 1. Instantiate clubs
    Object.entries(INITIAL_CLUBS).forEach(([divName, clubList]) => {
      this.divisions[divName] = clubList.map(clubData => {
        return new Club({
          ...clubData,
          division: divName,
          funds: this.getInitialFundsForDivision(divName),
          reputation: this.getInitialReputationForDivision(divName)
        });
      });
    });

    // 2. Add player's club to 3ª División as the starter club
    this.playerClub = new Club({
      id: 'player_club',
      name: playerClubConfig.name || 'CN Riazor',
      city: playerClubConfig.city || 'A Coruña',
      division: DIVISIONS.DIV3,
      isPlayer: true,
      primaryColor: playerClubConfig.primaryColor || '#0ea5e9',
      secondaryColor: playerClubConfig.secondaryColor || '#ffffff',
      funds: this.difficulty.startingFunds,
      reputation: 40
    });

    this.divisions[DIVISIONS.DIV3].push(this.playerClub);

    // 3. Populate all clubs with realistic swimmers
    Object.entries(this.divisions).forEach(([divName, clubs]) => {
      clubs.forEach(club => {
        this.populateClubSwimmers(club, divName);
      });
    });

    // 4. Generate initial swimmer market
    this.refreshMarket();
  }

  getInitialFundsForDivision(divName) {
    switch (divName) {
      case DIVISIONS.HONRA: return 45000;
      case DIVISIONS.DIV1: return 28000;
      case DIVISIONS.DIV2: return 18000;
      case DIVISIONS.DIV3: return 9000;
      default: return 10000;
    }
  }

  getInitialReputationForDivision(divName) {
    switch (divName) {
      case DIVISIONS.HONRA: return 85;
      case DIVISIONS.DIV1: return 70;
      case DIVISIONS.DIV2: return 55;
      case DIVISIONS.DIV3: return 40;
      default: return 50;
    }
  }

  /**
   * Generates a realistic squad of swimmers for a club in a division
   * Each club needs ~6-8 male and ~6-8 female swimmers for individual & relay depth
   */
  populateClubSwimmers(club, division) {
    const isHonra = division === DIVISIONS.HONRA;
    const isDiv1 = division === DIVISIONS.DIV1;
    const isDiv2 = division === DIVISIONS.DIV2;

    // Stat baseline by division
    let baseMin = 42;
    let baseMax = 58;
    if (isHonra) { baseMin = 75; baseMax = 92; }
    else if (isDiv1) { baseMin = 65; baseMax = 82; }
    else if (isDiv2) { baseMin = 54; baseMax = 70; }
    else {
      // Div 3: Balanced baseline across all clubs in 3ª División (~56 average rating)
      baseMin = 46;
      baseMax = 66;
    }

    const firstNamesM = ['Brais', 'Antón', 'Roi', 'Iago', 'Mateo', 'Lucas', 'Martín', 'Alex', 'Adrián', 'Pablo', 'Diego', 'Hugo', 'David', 'Manuel', 'Álvaro'];
    const firstNamesF = ['Uxía', 'Noa', 'Sara', 'Alba', 'Sabela', 'Lara', 'Carla', 'Lucía', 'Paula', 'Marta', 'Irene', 'Claudia', 'Elena', 'Carmen', 'Sofía'];
    const lastNames = ['Vázquez', 'Rodríguez', 'Fernández', 'López', 'González', 'Gómez', 'Pérez', 'Castro', 'Iglesias', 'Blanco', 'Díaz', 'Sánchez', 'Suárez', 'Álvarez', 'Mera', 'Loureiro', 'Freire'];

    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const strokeList = [STROKES.FREE, STROKES.BACK, STROKES.BREAST, STROKES.FLY, STROKES.IM];

    // Create 7 male and 7 female swimmers (total 14)
    ['M', 'F'].forEach(gender => {
      for (let i = 0; i < 7; i++) {
        const firstName = gender === 'M' ? pickRandom(firstNamesM) : pickRandom(firstNamesF);
        const lastName = `${pickRandom(lastNames)} ${pickRandom(lastNames)}`;
        const primaryStroke = strokeList[i % strokeList.length];
        const specialty = i % 2 === 0 ? 'sprint' : 'distance';

        const stats = {};
        STAT_KEYS.forEach(k => {
          let val = Math.floor(baseMin + Math.random() * (baseMax - baseMin));
          if (k === primaryStroke) val = Math.min(99, val + 10);
          if (specialty === 'sprint' && (k === 'speed' || k === 'strength')) val = Math.min(99, val + 6);
          if (specialty === 'distance' && k === 'distance') val = Math.min(99, val + 8);
          stats[k] = val;
        });

        const swimmer = new Swimmer({
          firstName,
          lastName,
          gender,
          age: Math.floor(15 + Math.random() * 11),
          primaryStroke,
          specialty,
          stats
        });

        // Assign to training group
        if (specialty === 'sprint') swimmer.trainingGroupId = 'group_sprint';
        else if (specialty === 'distance') swimmer.trainingGroupId = 'group_distance';
        else swimmer.trainingGroupId = 'group_strokes';

        club.addSwimmer(swimmer);
      }
    });
  }

  /**
   * Build 36-week schedule from September to May
   */
  buildSeasonSchedule() {
    return [
      { week: 1, month: 'Setembro', name: 'Comezo de Tempada', type: 'training', phase: PERIODIZATION_PHASES.BASE },
      { week: 2, month: 'Setembro', name: 'Adestramento Base 1', type: 'training', phase: PERIODIZATION_PHASES.BASE },
      { week: 3, month: 'Setembro', name: 'Adestramento Base 2', type: 'training', phase: PERIODIZATION_PHASES.BASE },
      { week: 4, month: 'Setembro', name: 'Adestramento Base 3', type: 'training', phase: PERIODIZATION_PHASES.BASE },
      { week: 5, month: 'Outubro', name: 'Carga Aeróbica 1', type: 'training', phase: PERIODIZATION_PHASES.BASE },
      { week: 6, month: 'Outubro', name: 'Carga Aeróbica 2', type: 'training', phase: PERIODIZATION_PHASES.BASE },
      { week: 7, month: 'Outubro', name: 'Carga Aeróbica 3', type: 'training', phase: PERIODIZATION_PHASES.BASE },
      { week: 8, month: 'Outubro', name: 'Inscrición de Probas - Xornada A', type: 'roster_deadline', meetKey: 'XORNADA_A', phase: PERIODIZATION_PHASES.SPECIFIC },
      { week: 9, month: 'Novembro', name: 'Competición: Xornada A (Fase Previa)', type: 'meet', meetKey: 'XORNADA_A', program: MEET_PROGRAMS.XORNADA_A, phase: PERIODIZATION_PHASES.COMPETITION_PACE },
      { week: 10, month: 'Novembro', name: 'Recuperación Activa', type: 'training', phase: PERIODIZATION_PHASES.RECOVERY },
      { week: 11, month: 'Novembro', name: 'Forza & Limiar 1', type: 'training', phase: PERIODIZATION_PHASES.SPECIFIC },
      { week: 12, month: 'Novembro', name: 'Forza & Limiar 2', type: 'training', phase: PERIODIZATION_PHASES.SPECIFIC },
      { week: 13, month: 'Decembro', name: 'Bloque de Inverno 1', type: 'training', phase: PERIODIZATION_PHASES.SPECIFIC },
      { week: 14, month: 'Decembro', name: 'Bloque de Inverno 2', type: 'training', phase: PERIODIZATION_PHASES.SPECIFIC },
      { week: 15, month: 'Decembro', name: 'Carga de Fin de Ano', type: 'training', phase: PERIODIZATION_PHASES.SPECIFIC },
      { week: 16, month: 'Xaneiro', name: 'Rexeneración de Ano Novo', type: 'training', phase: PERIODIZATION_PHASES.RECOVERY },
      { week: 17, month: 'Xaneiro', name: 'Inscrición de Probas - Xornada B', type: 'roster_deadline', meetKey: 'XORNADA_B', phase: PERIODIZATION_PHASES.COMPETITION_PACE },
      { week: 18, month: 'Xaneiro', name: 'Competición: Xornada B (Fase Previa)', type: 'meet', meetKey: 'XORNADA_B', program: MEET_PROGRAMS.XORNADA_B, phase: PERIODIZATION_PHASES.COMPETITION_PACE },
      { week: 19, month: 'Febreiro', name: 'Recuperación Post-Xornada B', type: 'training', phase: PERIODIZATION_PHASES.RECOVERY },
      { week: 20, month: 'Febreiro', name: 'Intensidade Máxima & VO2Max 1', type: 'training', phase: PERIODIZATION_PHASES.SPECIFIC },
      { week: 21, month: 'Febreiro', name: 'Intensidade Máxima & VO2Max 2', type: 'training', phase: PERIODIZATION_PHASES.SPECIFIC },
      { week: 22, month: 'Febreiro', name: 'Lactato & Ritmo Competitivo', type: 'training', phase: PERIODIZATION_PHASES.COMPETITION_PACE },
      { week: 23, month: 'Marzo', name: 'Series de Velocidade Pura', type: 'training', phase: PERIODIZATION_PHASES.COMPETITION_PACE },
      { week: 24, month: 'Marzo', name: 'Pre-Competición Xornada C', type: 'training', phase: PERIODIZATION_PHASES.COMPETITION_PACE },
      { week: 25, month: 'Marzo', name: 'Inscrición de Probas - Xornada C', type: 'roster_deadline', meetKey: 'XORNADA_C', phase: PERIODIZATION_PHASES.COMPETITION_PACE },
      { week: 26, month: 'Marzo', name: 'Competición: Xornada C (Fin Fase Previa)', type: 'meet', meetKey: 'XORNADA_C', program: MEET_PROGRAMS.XORNADA_C, phase: PERIODIZATION_PHASES.COMPETITION_PACE },
      { week: 27, month: 'Abril', name: 'Resolución de Fase Previa & Grupos Finais', type: 'prelim_resolution', phase: PERIODIZATION_PHASES.RECOVERY },
      { week: 28, month: 'Abril', name: 'Bloque Preparatorio Fase Final', type: 'training', phase: PERIODIZATION_PHASES.SPECIFIC },
      { week: 29, month: 'Abril', name: 'Taper Fase 1 (Baixada de Volume)', type: 'training', phase: PERIODIZATION_PHASES.TAPER },
      { week: 30, month: 'Abril', name: 'Taper Fase 2 (Afinación & Chispa)', type: 'training', phase: PERIODIZATION_PHASES.TAPER },
      { week: 31, month: 'Maio', name: 'Taper Fase 3 (Supercompensación)', type: 'training', phase: PERIODIZATION_PHASES.TAPER },
      { week: 32, month: 'Maio', name: 'Pico de Forma / Saídas & Viraxes', type: 'training', phase: PERIODIZATION_PHASES.TAPER },
      { week: 33, month: 'Maio', name: 'Inscrición Fase Final (Sesións 1 e 2)', type: 'roster_deadline', meetKey: 'FASE_FINAL', phase: PERIODIZATION_PHASES.TAPER },
      { week: 34, month: 'Maio', name: 'GRAN FASE FINAL DE CLUBS (Sesión 1 & 2)', type: 'final_meet', phase: PERIODIZATION_PHASES.COMPETITION_PACE },
      { week: 35, month: 'Maio', name: 'Gala de Premios, Ascensos & Descensos', type: 'season_end_ceremony', phase: PERIODIZATION_PHASES.RECOVERY },
      { week: 36, month: 'Xuño', name: 'Planificación da Próxima Tempada', type: 'offseason', phase: PERIODIZATION_PHASES.RECOVERY }
    ];
  }

  getCurrentScheduleEvent(forWeek = this.currentWeek) {
    const defaultEv = this.schedule.find(s => s.week === forWeek) || this.schedule[this.schedule.length - 1];
    if (this.playerClub && this.playerClub.customWeeklyPhases && this.playerClub.customWeeklyPhases[forWeek]) {
      const customPhaseId = this.playerClub.customWeeklyPhases[forWeek];
      const customPhaseObj = Object.values(PERIODIZATION_PHASES).find(p => p.id === customPhaseId);
      if (customPhaseObj) {
        return {
          ...defaultEv,
          phase: customPhaseObj,
          isCustomPhase: true
        };
      }
    }
    return defaultEv;
  }

  /**
   * Advances the simulation by 1 week
   */
  advanceWeek() {
    const currentEvent = this.getCurrentScheduleEvent();

    // 1. Process weekly training for all swimmers in all clubs
    this.processWeeklyTraining(currentEvent.phase);

    // 2. Process weekly club finances (salaries, subsidies, gate receipts)
    this.processWeeklyFinances();

    // 3. Weekly market refresh (small random chance of new scouted swimmers)
    if (Math.random() < 0.45) {
      this.refreshMarket();
    }

    // 4. Advance week number
    if (this.currentWeek < this.totalWeeks) {
      this.currentWeek++;
    }

    return {
      completedWeek: this.currentWeek - 1,
      newEvent: this.getCurrentScheduleEvent()
    };
  }

  /**
   * Applies periodization training for all swimmers
   */
  processWeeklyTraining(defaultPhase) {
    Object.values(this.divisions).forEach(clubs => {
      clubs.forEach(club => {
        const equipBonus = club.getEquipmentTrainingBonus();
        const recoveryBonus = club.getEquipmentRecoveryBonus();

        // Check if club coach assigned a custom periodization phase for this week
        let activePhase = defaultPhase;
        if (club.customWeeklyPhases && club.customWeeklyPhases[this.currentWeek]) {
          const customId = club.customWeeklyPhases[this.currentWeek];
          const matched = Object.values(PERIODIZATION_PHASES).find(p => p.id === customId);
          if (matched) activePhase = matched;
        }

        club.swimmers.forEach(swimmer => {
          const group = club.trainingGroups[swimmer.trainingGroupId] || club.trainingGroups.default;

          swimmer.applyWeeklyTraining({
            phase: activePhase,
            focusStroke: group.focusStroke,
            volumeLevel: group.volumeLevel,
            intensityMix: group.intensityMix,
            equipmentBonus: equipBonus,
            recoveryBonus: recoveryBonus,
            difficultyMultiplier: club.isPlayer ? this.difficulty.statGrowthMultiplier : 1.0,
            decayMultiplier: club.isPlayer ? this.difficulty.statDecayMultiplier : 1.0,
            fatigueAccumulationMultiplier: club.isPlayer ? this.difficulty.fatigueAccumulationMultiplier : 1.0,
            fatigueRecoveryMultiplier: club.isPlayer ? this.difficulty.fatigueRecoveryMultiplier : 1.0
          });
        });
      });
    });
  }

  /**
   * Processes weekly finances for all clubs
   */
  processWeeklyFinances() {
    Object.values(this.divisions).forEach(clubs => {
      clubs.forEach(club => {
        // Base weekly subsidy from federation & membership dues
        let baseSubsidy = 250;
        if (club.division === DIVISIONS.HONRA) baseSubsidy = 850;
        else if (club.division === DIVISIONS.DIV1) baseSubsidy = 550;
        else if (club.division === DIVISIONS.DIV2) baseSubsidy = 380;

        // Add weekly sponsorship revenue
        const sponsorIncome = club.calculateWeeklySponsorshipIncome();

        let totalWeeklyIncome = baseSubsidy + sponsorIncome;
        if (club.isPlayer) {
          totalWeeklyIncome = Math.round(totalWeeklyIncome * this.difficulty.prizeMoneyMultiplier);
        }

        const expenses = club.calculateTotalWeeklyExpenses();
        club.funds += (totalWeeklyIncome - expenses);
      });
    });
  }

  /**
   * Refreshes the swimmer transfer market
   */
  refreshMarket() {
    const firstNamesM = ['Marcos', 'Manuel', 'Brais', 'Samuel', 'Mateo', 'Alexandre', 'Martín', 'Gabriel', 'Xurxo', 'Adrián'];
    const firstNamesF = ['Noa', 'Uxia', 'Candela', 'Sabela', 'Lara', 'Alba', 'Antía', 'Carla', 'Sara', 'Laura'];
    const lastNames = ['Souto', 'Carballo', 'Rey', 'Paz', 'Guitián', 'Taboada', 'Novoa', 'Bermúdez', 'Barros', 'Ramos', 'Calvo', 'Fontán'];

    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const strokeList = [STROKES.FREE, STROKES.BACK, STROKES.BREAST, STROKES.FLY, STROKES.IM];

    const newMarket = [];
    const count = 10;

    for (let i = 0; i < count; i++) {
      const gender = Math.random() > 0.5 ? 'M' : 'F';
      const firstName = gender === 'M' ? pickRandom(firstNamesM) : pickRandom(firstNamesF);
      const lastName = `${pickRandom(lastNames)} ${pickRandom(lastNames)}`;
      const primaryStroke = pickRandom(strokeList);
      const specialty = Math.random() > 0.5 ? 'sprint' : 'distance';

      // Tier distribution: 50% Div 3 caliber, 30% Div 2, 15% Div 1, 5% Div Honra superstar
      const roll = Math.random();
      let baseMin = 45;
      let baseMax = 62;
      if (roll > 0.95) { baseMin = 78; baseMax = 93; }
      else if (roll > 0.80) { baseMin = 66; baseMax = 82; }
      else if (roll > 0.50) { baseMin = 55; baseMax = 72; }

      const stats = {};
      STAT_KEYS.forEach(k => {
        let val = Math.floor(baseMin + Math.random() * (baseMax - baseMin));
        if (k === primaryStroke) val = Math.min(99, val + 9);
        stats[k] = val;
      });

      const swimmer = new Swimmer({
        firstName,
        lastName,
        gender,
        age: Math.floor(15 + Math.random() * 10),
        primaryStroke,
        specialty,
        stats
      });

      newMarket.push(swimmer);
    }

    this.marketSwimmers = newMarket;
  }

  /**
   * Generates AI line-ups for all AI clubs for an upcoming meet
   */
  prepareAIMeetEntries(meetProgram, isFinalPhase = false) {
    Object.values(this.divisions).forEach(clubs => {
      clubs.forEach(club => {
        if (!club.isPlayer) {
          const { entries, reserves } = AICoach.generateMeetRoster(
            club,
            meetProgram,
            isFinalPhase,
            this.difficulty.aiOptimizationLevel,
            clubs.length
          );
          club.currentMeetEntries = entries;
          club.meetReserves = reserves;
        }
      });
    });
  }

  /**
   * Simulates an entire meet for a division
   */
  simulateDivisionMeet(divisionName, meetProgram, isFinalPhase = false, precomputedResults = null) {
    const clubs = this.divisions[divisionName] || [];
    let meetResults = precomputedResults;

    if (!meetResults) {
      meetResults = [];
      // Reset day-of-meet fatigue for all participating swimmers
      clubs.forEach(c => c.swimmers.forEach(s => s.resetMeetFatigue()));

      // Simulate event by event in exact circular order
      meetProgram.forEach((event, eventIdx) => {
        const eventResult = RaceSimulation.simulateEvent({
          event,
          division: divisionName,
          clubs,
          isFinalPhase,
          eventIndex: eventIdx
        });
        meetResults.push(eventResult);
      });
    }

    // Circular Section 5.3: Calculate ranking points for this xornada
    // Rank clubs based on total points scored during this xornada
    const xornadaClubScores = clubs.map(club => {
      const scoreInThisMeet = meetResults.reduce((acc, evRes) => {
        const clubScoreInEv = evRes.results
          .filter(r => r.club.id === club.id)
          .reduce((sum, r) => sum + r.points, 0);
        return acc + clubScoreInEv;
      }, 0);

      return {
        club,
        pointsScored: scoreInThisMeet
      };
    });

    // Sort descending by points scored
    xornadaClubScores.sort((a, b) => b.pointsScored - a.pointsScored);

    // Assign Xornada Points (7, 5, 4, 3, 2, 1 for 6 clubs; 8, 6, 5, 4, 3, 2, 1 for 7+ clubs)
    const rankPointsTable = clubs.length > 6
      ? SCORING_RULES.PRELIM_POINTS_7_PLUS_CLUBS.XORNADA_RANK
      : SCORING_RULES.PRELIM_POINTS_6_CLUBS.XORNADA_RANK;

    const divisionPrizes = PRIZE_MONEY.PER_MEET_BY_DIVISION[divisionName] || PRIZE_MONEY.PER_MEET_BY_DIVISION[DIVISIONS.DIV3];

    xornadaClubScores.forEach((entry, rankIdx) => {
      const xornadaPts = rankPointsTable[rankIdx] || 1;
      if (!isFinalPhase) {
        entry.club.prelimLeaguePoints += xornadaPts;
      } else {
        entry.club.finalLeaguePoints += xornadaPts;
      }
      entry.club.xornadaPlacements.push(rankIdx + 1);
      entry.xornadaRank = rankIdx + 1;
      entry.xornadaPointsEarned = xornadaPts;

      // Award Xornada Prize Money
      let prize = divisionPrizes[rankIdx] || 200;
      if (entry.club.isPlayer) {
        prize = Math.round(prize * this.difficulty.prizeMoneyMultiplier);
      }
      entry.club.funds += prize;
      entry.prizeMoneyEarned = prize;
    });

    // Record meet participation for limit tracking
    clubs.forEach(c => {
      c.recordMeetParticipation(isFinalPhase);
      c.clearMeetEntries();
    });

    return {
      divisionName,
      meetProgram,
      eventResults: meetResults,
      clubStandingsThisMeet: xornadaClubScores
    };
  }

  /**
   * Resolve Preliminary Phase (Circular Section 1.4 & 1.5)
   * Top 3 in Honra/1ª/2ª qualify for Grupo Título, bottom 3 for Grupo Permanencia.
   * Top 6 in 3ª Div qualify for Fase Final polo Título.
   */
  resolvePreliminaryPhase() {
    this.phase = 'post_prelim_split';
    const splitReport = {};

    Object.entries(this.divisions).forEach(([divName, clubs]) => {
      // Sort clubs by prelimLeaguePoints descending, then by prelimTotalPoints
      clubs.sort((a, b) => {
        if (b.prelimLeaguePoints !== a.prelimLeaguePoints) {
          return b.prelimLeaguePoints - a.prelimLeaguePoints;
        }
        return b.prelimTotalPoints - a.prelimTotalPoints;
      });

      if (divName === DIVISIONS.DIV3) {
        // Top 6 qualify for title/ascent final
        const titleFinalClubs = clubs.slice(0, 6);
        const nonQualifiedClubs = clubs.slice(6);
        splitReport[divName] = {
          titleGroup: titleFinalClubs,
          permanenceGroup: nonQualifiedClubs
        };
      } else {
        // Top 3 to title/ascent, bottom 3 to permanence
        splitReport[divName] = {
          titleGroup: clubs.slice(0, 3),
          permanenceGroup: clubs.slice(3, 6)
        };
      }
    });

    return splitReport;
  }

  /**
   * Final Season Promotions & Relegations (Circular Section 5.8)
   * Bottom 2 of each division relegated; Top 2 of lower division promoted!
   */
  finalizeSeason() {
    this.phase = 'season_ended';
    const promotionRelegationLog = [];

    // Pre-calculate promotions and relegations before mutating divisions
    const promotions = {}; // lowerDiv -> array of promoted clubs
    const relegations = {}; // upperDiv -> array of relegated clubs

    for (let i = 0; i < DIVISION_ORDER.length - 1; i++) {
      const lowerDiv = DIVISION_ORDER[i];
      const upperDiv = DIVISION_ORDER[i + 1];

      const lowerClubs = [...this.divisions[lowerDiv]].sort((a, b) => (b.finalLeaguePoints - a.finalLeaguePoints) || (b.finalTotalPoints - a.finalTotalPoints));
      const upperClubs = [...this.divisions[upperDiv]].sort((a, b) => (b.finalLeaguePoints - a.finalLeaguePoints) || (b.finalTotalPoints - a.finalTotalPoints));

      // Top 2 of lower division get promoted
      promotions[lowerDiv] = lowerClubs.slice(0, 2);
      // Bottom 2 of upper division get relegated
      relegations[upperDiv] = upperClubs.slice(upperClubs.length - 2);
    }

    // Now apply promotions and relegations simultaneously
    for (let i = 0; i < DIVISION_ORDER.length - 1; i++) {
      const lowerDiv = DIVISION_ORDER[i];
      const upperDiv = DIVISION_ORDER[i + 1];

      const promotedClubs = promotions[lowerDiv] || [];
      const relegatedClubs = relegations[upperDiv] || [];

      promotedClubs.forEach(club => {
        club.division = upperDiv;
        club.trophies.push(`Ascenso a ${upperDiv} (${this.currentSeasonYear})`);
        promotionRelegationLog.push({ type: 'PROMOTION', clubName: club.name, from: lowerDiv, to: upperDiv });
      });

      relegatedClubs.forEach(club => {
        club.division = lowerDiv;
        promotionRelegationLog.push({ type: 'RELEGATION', clubName: club.name, from: upperDiv, to: lowerDiv });
      });

      // Update division arrays cleanly
      this.divisions[lowerDiv] = this.divisions[lowerDiv].filter(c => !promotedClubs.includes(c)).concat(relegatedClubs);
      this.divisions[upperDiv] = this.divisions[upperDiv].filter(c => !relegatedClubs.includes(c)).concat(promotedClubs);
    }

    // Award Big End-of-Season Championship Prize Money
    Object.values(this.divisions).forEach(divClubs => {
      const sortedClubs = [...divClubs].sort((a, b) => (b.finalLeaguePoints - a.finalLeaguePoints) || (b.finalTotalPoints - a.finalTotalPoints));
      sortedClubs.forEach((c, rankIdx) => {
        const bonusObj = PRIZE_MONEY.SEASON_END_BONUS[rankIdx] || PRIZE_MONEY.SEASON_END_BONUS[PRIZE_MONEY.SEASON_END_BONUS.length - 1];
        let endPrize = bonusObj.prize;
        if (c.isPlayer) {
          endPrize = Math.round(endPrize * this.difficulty.prizeMoneyMultiplier);
        }
        c.funds += endPrize;
        c.lastSeasonPrize = endPrize;
      });
    });

    // Award Leopold Bremón Trophies for Best Swimmers
    const bestSwimmers = this.awardSeasonTrophies();

    return {
      year: this.currentSeasonYear,
      promotionRelegationLog,
      bestSwimmers
    };
  }

  awardSeasonTrophies() {
    let topMale = null;
    let topFemale = null;
    let maxPtsM = -1;
    let maxPtsF = -1;

    Object.values(this.divisions).forEach(clubs => {
      clubs.forEach(club => {
        club.swimmers.forEach(s => {
          if (s.gender === 'M' && s.seasonPoints > maxPtsM) {
            maxPtsM = s.seasonPoints;
            topMale = { swimmer: s, clubName: club.name, points: s.seasonPoints };
          }
          if (s.gender === 'F' && s.seasonPoints > maxPtsF) {
            maxPtsF = s.seasonPoints;
            topFemale = { swimmer: s, clubName: club.name, points: s.seasonPoints };
          }
        });
      });
    });

    return { topMale, topFemale };
  }
}
