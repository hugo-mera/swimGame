// AI Coaching & Roster Optimization Engine
// Follows FEGAN Circular 26-14 rules for line-ups and strategic relay assembly
import { PARTICIPATION_LIMITS, DIVISIONS, STROKES } from '../constants.js';

export class AICoach {
  /**
   * Generates a fully compliant, high-performing roster for a meet
   * @param {Club} club 
   * @param {Array} meetProgram 
   * @param {boolean} isFinalPhase 
   * @param {number} optimizationLevel (0.6 to 1.0)
   * @param {number} totalClubsInDiv
   */
  static generateMeetRoster(club, meetProgram, isFinalPhase = false, optimizationLevel = 0.9, totalClubsInDiv = 6) {
    const entries = {};
    const swimmerMeetEventCount = {}; // swimmerId -> count of individual events in this session
    club.swimmers.forEach(s => {
      swimmerMeetEventCount[s.id] = 0;
    });

    // 1. Separate individual events and relay events
    const individualEvents = meetProgram.filter(e => !e.isRelay);
    const relayEvents = meetProgram.filter(e => e.isRelay);

    // Map out each swimmer's suitability and projected time for every event
    const swimmerEventScores = [];

    individualEvents.forEach((event, eventIdx) => {
      entries[event.id] = [];

      // Determine max swimmers allowed for this event
      const isLongDist = [400, 800, 1500].includes(event.distance);
      const isDiv3Prelim = !isFinalPhase && club.division === DIVISIONS.DIV3;
      const maxInEvent = isDiv3Prelim && isLongDist && totalClubsInDiv > 6 ? 1 : PARTICIPATION_LIMITS.MAX_SWIMMERS_PER_EVENT_PER_CLUB;

      club.swimmers.forEach(swimmer => {
        // Gender match
        if (swimmer.gender !== event.gender) return;

        // Check phase limits
        const phaseSwum = isFinalPhase ? (club.finalEventsSwum[swimmer.id] || 0) : (club.prelimEventsSwum[swimmer.id] || 0);
        const maxPhase = isFinalPhase ? PARTICIPATION_LIMITS.MAX_INDIVIDUAL_FINAL_TOTAL : PARTICIPATION_LIMITS.MAX_INDIVIDUAL_PRELIM_TOTAL;
        if (phaseSwum >= maxPhase) return;

        // Calculate projected time & rating
        const rating = swimmer.getEffectiveEventRating(event);
        const estTime = swimmer.getEstimatedTime(event);

        swimmerEventScores.push({
          swimmerId: swimmer.id,
          eventId: event.id,
          eventIdx,
          event,
          maxInEvent,
          rating,
          estTime
        });
      });
    });

    // Sort by rating descending (strongest performances first)
    swimmerEventScores.sort((a, b) => b.rating - a.rating);

    // Assign swimmers to individual events
    for (const item of swimmerEventScores) {
      const { swimmerId, eventId, eventIdx, maxInEvent } = item;
      const currentList = entries[eventId];

      // Check if event is already full
      if (currentList.length >= maxInEvent) continue;

      // Check if swimmer already entered in this event
      if (currentList.includes(swimmerId)) continue;

      // Check if swimmer has already swum 2 individual events in this meet
      if (swimmerMeetEventCount[swimmerId] >= PARTICIPATION_LIMITS.MAX_INDIVIDUAL_PER_SESSION) continue;

      // Sub-optimal randomness check for lower difficulty levels
      if (Math.random() > optimizationLevel && Math.random() < 0.25) {
        // Occasionally skip the #1 choice on easier difficulties to simulate human coaching imperfection
        continue;
      }

      // Check adjacent events fatigue penalty (if swimmer swims consecutive events)
      // If AI has someone almost as good, prefer avoiding consecutive races
      const hasAdjacent = Object.entries(entries).some(([otherEvId, list]) => {
        if (!list.includes(swimmerId)) return false;
        const otherIdx = individualEvents.findIndex(e => e.id === otherEvId);
        return Math.abs(otherIdx - eventIdx) <= 1;
      });

      if (hasAdjacent && Math.random() < optimizationLevel * 0.7 && currentList.length === 0) {
        // Let other swimmers take the slot if available
        const alternativeExists = swimmerEventScores.some(alt =>
          alt.eventId === eventId &&
          alt.swimmerId !== swimmerId &&
          swimmerMeetEventCount[alt.swimmerId] < PARTICIPATION_LIMITS.MAX_INDIVIDUAL_PER_SESSION
        );
        if (alternativeExists) continue;
      }

      // Assign!
      currentList.push(swimmerId);
      swimmerMeetEventCount[swimmerId]++;
    }

    // Now, optimize relay teams
    relayEvents.forEach(relayEvent => {
      entries[relayEvent.id] = AICoach.assembleRelayTeam(club, relayEvent);
    });

    // Register up to 4 reserves
    const reserves = club.swimmers
      .filter(s => swimmerMeetEventCount[s.id] === 0)
      .slice(0, 4)
      .map(s => s.id);

    return {
      entries,
      reserves
    };
  }

  /**
   * Builds the fastest 4-person relay team for a relay event
   */
  static assembleRelayTeam(club, relayEvent) {
    const isMixed = relayEvent.gender === 'MIXED';
    const isMedley = relayEvent.legs && (relayEvent.legs[0] === STROKES.BACK);

    if (isMixed) {
      return AICoach.assembleMixedRelay(club, relayEvent);
    }

    const pool = club.swimmers.filter(s => s.gender === relayEvent.gender);
    if (pool.length < 4) {
      return pool.map(s => s.id);
    }

    if (isMedley) {
      // 4x50 or 4x100 Estilos: Leg 1 = Back, Leg 2 = Breast, Leg 3 = Fly, Leg 4 = Free
      const legs = [STROKES.BACK, STROKES.BREAST, STROKES.FLY, STROKES.FREE];
      const selected = [];
      const remainingPool = [...pool];

      legs.forEach((stroke, legIdx) => {
        // Pick best swimmer for this stroke among remaining
        const dummyEvent = { distance: relayEvent.legDist || 50, stroke };
        remainingPool.sort((a, b) => b.getEffectiveEventRating(dummyEvent) - a.getEffectiveEventRating(dummyEvent));
        if (remainingPool.length > 0) {
          const chosen = remainingPool.shift();
          selected.push(chosen.id);
        }
      });

      return selected;
    } else {
      // Freestyle Relay: Top 4 fastest freestyle sprinters/middle-distance
      const dummyEvent = { distance: relayEvent.legDist || 50, stroke: STROKES.FREE };
      const sorted = [...pool].sort((a, b) => b.getEffectiveEventRating(dummyEvent) - a.getEffectiveEventRating(dummyEvent));
      return sorted.slice(0, 4).map(s => s.id);
    }
  }

  /**
   * Builds a mixed relay (2 Men, 2 Women)
   */
  static assembleMixedRelay(club, relayEvent) {
    const men = club.swimmers.filter(s => s.gender === 'M');
    const women = club.swimmers.filter(s => s.gender === 'F');

    if (men.length < 2 || women.length < 2) {
      // Fallback
      return [...men.slice(0, 2), ...women.slice(0, 2)].map(s => s.id);
    }

    const isMedley = relayEvent.legs && (relayEvent.legs[0] === STROKES.BACK);

    if (!isMedley) {
      // 4x100 Libre Mixto: top 2 men + top 2 women
      const dummyEvent = { distance: 100, stroke: STROKES.FREE };
      const topMen = [...men].sort((a, b) => b.getEffectiveEventRating(dummyEvent) - a.getEffectiveEventRating(dummyEvent)).slice(0, 2);
      const topWomen = [...women].sort((a, b) => b.getEffectiveEventRating(dummyEvent) - a.getEffectiveEventRating(dummyEvent)).slice(0, 2);
      return [topMen[0].id, topMen[1].id, topWomen[0].id, topWomen[1].id];
    } else {
      // 4x100 Estilos Mixto:
      // Must assign 2 men and 2 women across [Back, Breast, Fly, Free] to minimize total time
      const strokes = [STROKES.BACK, STROKES.BREAST, STROKES.FLY, STROKES.FREE];
      const patterns = [
        ['M', 'M', 'F', 'F'],
        ['M', 'F', 'M', 'F'],
        ['M', 'F', 'F', 'M'],
        ['F', 'M', 'M', 'F'],
        ['F', 'M', 'F', 'M'],
        ['F', 'F', 'M', 'M']
      ];

      let bestTime = Infinity;
      let bestCombination = [];

      patterns.forEach(pat => {
        const currentTeam = [];
        let comboTime = 0;
        const usedIds = new Set();

        for (let i = 0; i < 4; i++) {
          const reqGender = pat[i];
          const stroke = strokes[i];
          const pool = (reqGender === 'M' ? men : women).filter(s => !usedIds.has(s.id));
          if (pool.length === 0) return;

          const dummyEvent = { distance: 100, stroke };
          pool.sort((a, b) => a.getEstimatedTime(dummyEvent) - b.getEstimatedTime(dummyEvent));
          const swimmer = pool[0];
          usedIds.add(swimmer.id);
          currentTeam.push(swimmer.id);
          comboTime += swimmer.getEstimatedTime(dummyEvent);
        }

        if (currentTeam.length === 4 && comboTime < bestTime) {
          bestTime = comboTime;
          bestCombination = currentTeam;
        }
      });

      return bestCombination.length === 4 ? bestCombination : [...men.slice(0, 2), ...women.slice(0, 2)].map(s => s.id);
    }
  }
}
