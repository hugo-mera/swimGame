// Swimmer Model - Core athlete entity with 8 stats, fatigue dynamics, and performance modeling
import { STAT_KEYS, STROKES } from '../constants.js';

export class Swimmer {
  constructor(data = {}) {
    this.id = data.id || `swimmer_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    this.firstName = data.firstName || 'Nadador';
    this.lastName = data.lastName || 'Galego';
    this.gender = data.gender || (Math.random() > 0.5 ? 'M' : 'F');
    this.age = data.age || Math.floor(15 + Math.random() * 12);
    this.clubId = data.clubId || null;
    this.trainingGroupId = data.trainingGroupId || 'default';
    this.primaryStroke = data.primaryStroke || STROKES.FREE;
    this.specialty = data.specialty || (Math.random() > 0.5 ? 'sprint' : 'distance');

    // 8 Required Core Stats (1 - 100)
    this.stats = {
      speed: data.stats?.speed || 50,
      distance: data.stats?.distance || 50,
      strength: data.stats?.strength || 50,
      freestyle: data.stats?.freestyle || 50,
      backstroke: data.stats?.backstroke || 50,
      breaststroke: data.stats?.breaststroke || 50,
      butterfly: data.stats?.butterfly || 50,
      IM: data.stats?.IM || 50
    };

    // Fatigue & Readiness Tracking
    this.chronicFatigue = data.chronicFatigue ?? 10; // 0 - 100 (cumulative training load)
    this.acuteFatigue = data.acuteFatigue ?? 10;     // 0 - 100 (current week fatigue)
    this.raceMeetFatigue = data.raceMeetFatigue ?? 0; // 0 - 100 (accumulated during race day)
    this.morale = data.morale ?? 75;                // 0 - 100
    this.salary = data.salary || this.calculateBaseSalary();

    // Records & History
    this.personalBests = data.personalBests || {}; // eventId -> time in seconds
    this.seasonPoints = data.seasonPoints || 0;
    this.racesCount = data.racesCount || 0;
    this.winsCount = data.winsCount || 0;
    this.trainingLog = data.trainingLog || [];
    // Stat changes in the last training week (key -> +/- number)
    this.lastStatChanges = data.lastStatChanges || {};
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  // Calculate overall performance rating (0-100)
  get overallRating() {
    const values = Object.values(this.stats);
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.round(sum / values.length);
  }

  // Best specialty rating
  get peakRating() {
    const strokeRating = Math.max(
      this.stats.freestyle,
      this.stats.backstroke,
      this.stats.breaststroke,
      this.stats.butterfly,
      this.stats.IM
    );
    const conditioning = Math.max(this.stats.speed, this.stats.distance);
    return Math.round(strokeRating * 0.6 + conditioning * 0.3 + this.stats.strength * 0.1);
  }

  // Form / Sharpness = Fitness - Fatigue supercompensation model
  get form() {
    const fitness = this.overallRating;
    const totalFatigue = this.chronicFatigue * 0.6 + this.acuteFatigue * 0.4;
    // When fatigue is low and fitness high, form can peak above 100
    const formIndex = Math.max(30, Math.min(115, fitness + (50 - totalFatigue) * 0.5));
    return Math.round(formIndex);
  }

  calculateBaseSalary() {
    const rating = this.overallRating;
    // Realistic amateur & club swimming stipends (€/week: ~8-20€ in Div3, up to 60-90€ in Div Honra)
    return Math.max(5, Math.round(Math.pow(rating / 35, 2.0) * 8));
  }

  calculateMarketValue(multiplier = 1.0) {
    const rating = this.peakRating;
    const ageFactor = this.age < 20 ? 1.3 : this.age < 24 ? 1.0 : 0.75;
    const baseValue = Math.round(Math.pow(rating / 10, 3.1) * 35 * ageFactor);
    return Math.round(baseValue * multiplier);
  }

  /**
   * Calculate effective skill rating for a specific race event
   * Blends speed, distance, strength, and specific stroke/IM
   */
  getEffectiveEventRating(event) {
    const dist = event.distance;
    const stroke = event.stroke;

    let strokeSkill = 50;
    if (stroke === STROKES.IM) {
      // IM requires all strokes + IM transition skill
      const avgStrokes = (this.stats.freestyle + this.stats.backstroke + this.stats.breaststroke + this.stats.butterfly) / 4;
      strokeSkill = this.stats.IM * 0.5 + avgStrokes * 0.5;
    } else {
      strokeSkill = this.stats[stroke] || this.stats.freestyle;
    }

    let speedWeight = 0.4;
    let distWeight = 0.1;
    let strengthWeight = 0.2;
    let strokeWeight = 0.3;

    if (dist <= 50) {
      speedWeight = 0.42;
      distWeight = 0.05;
      strengthWeight = 0.23;
      strokeWeight = 0.30;
    } else if (dist <= 100) {
      speedWeight = 0.35;
      distWeight = 0.15;
      strengthWeight = 0.18;
      strokeWeight = 0.32;
    } else if (dist <= 200) {
      speedWeight = 0.20;
      distWeight = 0.32;
      strengthWeight = 0.15;
      strokeWeight = 0.33;
    } else if (dist <= 400) {
      speedWeight = 0.10;
      distWeight = 0.46;
      strengthWeight = 0.10;
      strokeWeight = 0.34;
    } else {
      // 800m or 1500m
      speedWeight = 0.05;
      distWeight = 0.60;
      strengthWeight = 0.07;
      strokeWeight = 0.28;
    }

    const rawSkill = (
      this.stats.speed * speedWeight +
      this.stats.distance * distWeight +
      this.stats.strength * strengthWeight +
      strokeSkill * strokeWeight
    );

    // Morale modifier (±3%)
    const moraleMod = 1 + (this.morale - 75) * 0.0012;

    // Chronic and acute fatigue effect (progressive realistic curve, up to -4% if heavily fatigued)
    const combinedFatigue = this.chronicFatigue * 0.5 + this.acuteFatigue * 0.5;
    const baseFatiguePenalty = Math.max(0, (combinedFatigue - 35) * 0.0008);

    // Meet day fatigue effect (accumulated in current competition session, up to -5%)
    const meetFatiguePenalty = this.raceMeetFatigue * 0.0006;

    // Form bonus/penalty: Peaked taper grants supercompensation bonus (+2.5%)
    const formBonus = (this.form - 70) * 0.0006;

    const totalMod = Math.max(0.80, (moraleMod - baseFatiguePenalty - meetFatiguePenalty + formBonus));
    return rawSkill * totalMod;
  }

  /**
   * Realistic swim time generator in seconds for Short Course (25m pool)
   */
  getEstimatedTime(event, randomFactor = 0) {
    const dist = event.distance;
    const stroke = event.stroke;
    const effectiveRating = this.getEffectiveEventRating(event); // ~30 to ~95

    // Base benchmark times (in seconds) for Rating 100 vs Rating 30 (Male & Female)
    // Short Course Meters (SCM) standard times
    const genderOffset = this.gender === 'F' ? 1.09 : 1.0;

    let base50Time = 21.8; // World class 50m Free male
    if (stroke === STROKES.FLY) base50Time = 22.8;
    else if (stroke === STROKES.BACK) base50Time = 23.9;
    else if (stroke === STROKES.BREAST) base50Time = 26.2;
    else if (stroke === STROKES.IM) base50Time = 25.0; // 50 IM pace

    base50Time *= genderOffset;

    // Rating scale: Rating 100 = base50Time, Rating 30 = base50Time * 1.62
    const ratingFactor = 1 + ((100 - effectiveRating) / 70) * 0.55;
    const effective50Pace = base50Time * ratingFactor;

    // Pacing curve for longer distances
    let calculatedTime = 0;
    if (dist === 50) {
      calculatedTime = effective50Pace;
    } else if (dist === 100) {
      calculatedTime = effective50Pace * 2 * 1.07;
    } else if (dist === 200) {
      calculatedTime = effective50Pace * 4 * 1.13;
    } else if (dist === 400) {
      calculatedTime = effective50Pace * 8 * 1.19;
    } else if (dist === 800) {
      calculatedTime = effective50Pace * 16 * 1.23;
    } else if (dist === 1500) {
      calculatedTime = effective50Pace * 30 * 1.26;
    }

    // Apply random day factor (e.g. ±1.2%)
    if (randomFactor !== 0) {
      calculatedTime *= (1 + randomFactor);
    }

    return Math.round(calculatedTime * 100) / 100;
  }

  /**
   * Adds race-day fatigue when swimming an event
   */
  addRaceFatigue(eventDistance) {
    let fatigueAdded = 10;
    if (eventDistance <= 50) fatigueAdded = 9;
    else if (eventDistance <= 100) fatigueAdded = 15;
    else if (eventDistance <= 200) fatigueAdded = 24;
    else if (eventDistance <= 400) fatigueAdded = 34;
    else if (eventDistance <= 800) fatigueAdded = 46;
    else fatigueAdded = 58;

    // High distance/stamina reduces fatigue gain
    const enduranceRelief = (this.stats.distance / 100) * 0.35;
    this.raceMeetFatigue = Math.min(100, this.raceMeetFatigue + fatigueAdded * (1 - enduranceRelief));
  }

  /**
   * Recovers race-day fatigue between events depending on the event gap
   * gap: number of events in the schedule between this swimmer's races
   */
  recoverBetweenEvents(gap = 1, equipmentBonus = 0) {
    if (this.raceMeetFatigue <= 0) return;
    // Standard meet has ~4-5 mins per event. A gap of 10 events gives ~45 mins rest.
    const recoveryRate = Math.min(0.90, (gap * 0.12) * (1 + equipmentBonus));
    this.raceMeetFatigue = Math.max(0, this.raceMeetFatigue * (1 - recoveryRate));
  }

  resetMeetFatigue() {
    this.raceMeetFatigue = 0;
  }

  /**
   * Apply weekly training based on periodization phase & group workout focus
   */
  applyWeeklyTraining({
    phase,
    focusStroke = 'balanced',
    volumeLevel = 'medium', // 'low', 'medium', 'high', 'extreme'
    intensityMix = { aerobic: 50, threshold: 30, sprint: 20 },
    equipmentBonus = 0,
    recoveryBonus = 0,
    difficultyMultiplier = 1.0,
    decayMultiplier = 1.0,
    fatigueAccumulationMultiplier = 1.0,
    fatigueRecoveryMultiplier = 1.0
  }) {
    // Save snapshot of previous stats to track positive (green) and negative (red) changes
    const prevStats = { ...this.stats };

    // 1. Fatigue adjustments (Banister fitness-fatigue impulse response model)
    const volFactors = { low: 0.7, medium: 1.0, high: 1.35, extreme: 1.7 };
    const volFactor = volFactors[volumeLevel] || 1.0;

    let acuteFatigueChange = 14 * volFactor * phase.fatigueAccumulation * fatigueAccumulationMultiplier * (1 - equipmentBonus * 0.15);
    
    // Taper phase or Recovery phase clears fatigue rapidly
    if (phase.fatigueClearanceBonus) {
      this.acuteFatigue = Math.max(5, Math.min(95, this.acuteFatigue * 0.25 - 10 * phase.fatigueClearanceBonus * fatigueRecoveryMultiplier * (1 + recoveryBonus)));
      this.chronicFatigue = Math.max(5, this.chronicFatigue - 14 * phase.fatigueClearanceBonus * fatigueRecoveryMultiplier * (1 + recoveryBonus));
    } else {
      // Acute fatigue partially decays each week (Banister weekly half-life) while new load is absorbed
      this.acuteFatigue = Math.max(5, Math.min(95, this.acuteFatigue * 0.45 + acuteFatigueChange));
      // Chronic fatigue builds from sustained acute fatigue
      this.chronicFatigue = Math.max(5, Math.min(95, this.chronicFatigue + (this.acuteFatigue > 35 ? 3 : this.acuteFatigue > 25 ? 1 : -1)));
    }

    // 2. Stat growth calculations based on phase & intensity
    const growthBase = 0.45 * difficultyMultiplier * (1 + equipmentBonus);

    // Primary phase growth
    phase.primaryGrowth.forEach(statKey => {
      if (this.stats[statKey] < 98) {
        const diminishingReturns = (100 - this.stats[statKey]) / 60;
        this.stats[statKey] = Math.min(99, this.stats[statKey] + growthBase * 1.5 * diminishingReturns);
      }
    });

    // Secondary phase growth
    phase.secondaryGrowth.forEach(statKey => {
      if (this.stats[statKey] < 98) {
        const diminishingReturns = (100 - this.stats[statKey]) / 60;
        this.stats[statKey] = Math.min(99, this.stats[statKey] + growthBase * 0.8 * diminishingReturns);
      }
    });

    // Specific focus stroke boost
    if (focusStroke && focusStroke !== 'balanced' && this.stats[focusStroke] !== undefined) {
      const diminishingReturns = (100 - this.stats[focusStroke]) / 60;
      this.stats[focusStroke] = Math.min(99, this.stats[focusStroke] + growthBase * 1.2 * diminishingReturns);
    }

    // Intensity mix effect:
    // Sprint % develops speed
    if (intensityMix.sprint > 25 && this.stats.speed < 98) {
      this.stats.speed = Math.min(99, this.stats.speed + growthBase * (intensityMix.sprint / 100));
    }
    // Aerobic % develops distance
    if (intensityMix.aerobic > 40 && this.stats.distance < 98) {
      this.stats.distance = Math.min(99, this.stats.distance + growthBase * (intensityMix.aerobic / 100));
    }

    // 3. Stat decay if neglected (realistic periodization rule: unused systems lose edge slowly)
    STAT_KEYS.forEach(stat => {
      if (!phase.primaryGrowth.includes(stat) && stat !== focusStroke && this.stats[stat] > 40) {
        // Very slow gradual decay if completely neglected
        const decayRate = 0.08 * decayMultiplier;
        this.stats[stat] = Math.max(30, this.stats[stat] - decayRate);
      }
      // Round to 1 decimal place
      this.stats[stat] = Math.round(this.stats[stat] * 10) / 10;
    });

    // Clean up bounds
    this.chronicFatigue = Math.round(this.chronicFatigue);
    this.acuteFatigue = Math.round(this.acuteFatigue);

    // Record week-over-week stat changes
    this.lastStatChanges = {};
    STAT_KEYS.forEach(stat => {
      const delta = Math.round((this.stats[stat] - prevStats[stat]) * 10) / 10;
      this.lastStatChanges[stat] = delta;
    });
  }

  updatePersonalBest(eventId, time) {
    if (!this.personalBests[eventId] || time < this.personalBests[eventId]) {
      this.personalBests[eventId] = time;
      this.morale = Math.min(100, this.morale + 5);
      return true; // New Personal Best!
    }
    return false;
  }
}
