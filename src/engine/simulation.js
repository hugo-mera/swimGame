// Race Simulation Engine
// Computes race results, lap splits, continuous 2D positions, and FEGAN league points
import { SCORING_RULES, DIVISIONS, STROKES } from '../constants.js';

export class RaceSimulation {
  /**
   * Formats seconds into standard swim time string (e.g. 54.32 or 1:58.45 or 15:32.10)
   */
  static formatTime(seconds) {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '--:--.--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const hundredths = Math.floor((seconds % 1) * 100);

    const pad = (n, width = 2) => String(n).padStart(width, '0');

    if (mins > 0) {
      return `${mins}:${pad(secs)}.${pad(hundredths)}`;
    }
    return `${pad(secs)}.${pad(hundredths)}`;
  }

  /**
   * Generates a Gaussian random variable for realistic natural race variation
   */
  static randomGaussian(mean = 0, stdev = 1) {
    let u = 1 - Math.random();
    let v = Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z * stdev;
  }

  /**
   * Simulates a single event from the meet program for all participating clubs
   */
  static simulateEvent({
    event,
    division,
    clubs,
    isFinalPhase = false,
    eventIndex = 0
  }) {
    const participants = [];

    // 1. Gather all entries for this event across participating clubs
    clubs.forEach(club => {
      const entryList = club.currentMeetEntries[event.id] || [];

      if (event.isRelay) {
        // Relay entry: entryList is array of swimmerIds
        if (entryList.length >= 4) {
          const relaySwimmers = entryList.map(sId => club.getSwimmer(sId)).filter(Boolean);
          if (relaySwimmers.length === 4) {
            participants.push({
              club,
              swimmers: relaySwimmers,
              isRelay: true,
              seedTime: 0
            });
          }
        }
      } else {
        // Individual entries
        entryList.forEach(sId => {
          const swimmer = club.getSwimmer(sId);
          if (swimmer) {
            participants.push({
              club,
              swimmer,
              isRelay: false,
              seedTime: swimmer.getEstimatedTime(event)
            });
          }
        });
      }
    });

    // 2. Compute actual times with random variance, block equipment bonus, and fatigue
    const results = participants.map((entry, idx) => {
      const clubBonus = entry.club.getEquipmentRaceStartBonus(); // omega block reaction bonus

      if (entry.isRelay) {
        // Relay calculation: sum of 4 legs
        let totalRelayTime = 0;
        const legSplits = [];

        entry.swimmers.forEach((swimmer, legIdx) => {
          const legStroke = (event.legs && event.legs[legIdx]) ? event.legs[legIdx] : event.stroke;
          const legEvent = { distance: event.legDist || 50, stroke: legStroke };

          // Random factor ±1.1% per leg
          const rand = RaceSimulation.randomGaussian(0, 0.007);
          const rawLegTime = swimmer.getEstimatedTime(legEvent, rand);

          // Relay takeover bonus on legs 2, 3, 4 (-0.45s relay rolling start)
          const takeoffBonus = legIdx > 0 ? 0.45 : clubBonus;
          const finalLegTime = Math.max(10, rawLegTime - takeoffBonus);

          totalRelayTime += finalLegTime;
          legSplits.push({
            swimmerName: swimmer.fullName,
            time: finalLegTime,
            stroke: legStroke
          });

          // Add race fatigue to swimmer
          swimmer.addRaceFatigue(event.legDist || 50);
        });

        return {
          id: `relay_${entry.club.id}_${idx}`,
          club: entry.club,
          clubName: entry.club.name,
          clubColor: entry.club.primaryColor,
          isRelay: true,
          swimmers: entry.swimmers,
          relayName: `${entry.club.name} Relevo`,
          finalTime: Math.round(totalRelayTime * 100) / 100,
          legSplits
        };
      } else {
        // Individual event calculation
        const swimmer = entry.swimmer;
        // Natural random factor ±1.2%
        const rand = RaceSimulation.randomGaussian(0, 0.008);
        const rawTime = swimmer.getEstimatedTime(event, rand);
        const finalTime = Math.max(15, Math.round((rawTime - clubBonus) * 100) / 100);

        // Check if Personal Best
        const isPB = swimmer.updatePersonalBest(event.id, finalTime);

        // Add race fatigue
        swimmer.addRaceFatigue(event.distance);

        return {
          id: `ind_${swimmer.id}`,
          club: entry.club,
          clubName: entry.club.name,
          clubColor: entry.club.primaryColor,
          isRelay: false,
          swimmer,
          swimmerName: swimmer.fullName,
          finalTime,
          isPB
        };
      }
    });

    // 3. Sort by finalTime ascending (fastest first)
    results.sort((a, b) => a.finalTime - b.finalTime);

    // 4. Assign lanes (fastest swimmers in middle lanes 3, 4, then 2, 5, 1, 6...)
    const lanePattern = [4, 3, 5, 2, 6, 1, 7, 8];
    results.forEach((res, rankIdx) => {
      res.rank = rankIdx + 1;
      res.lane = lanePattern[rankIdx % lanePattern.length] || (rankIdx + 1);
    });

    // 5. Calculate Points according to Circular 26-14 rules
    const pointsTable = RaceSimulation.getScoringTable(division, isFinalPhase, clubs.length, event.isRelay);

    results.forEach((res, rankIdx) => {
      const points = pointsTable[rankIdx] || 0;
      res.points = points;

      // Credit points to club
      if (isFinalPhase) {
        res.club.finalTotalPoints += points;
      } else {
        res.club.prelimTotalPoints += points;
      }

      if (!res.isRelay && res.swimmer) {
        res.swimmer.seasonPoints += points;
        res.swimmer.racesCount += 1;
        if (res.rank === 1) res.swimmer.winsCount += 1;
      }
    });

    // 6. Rest recovery: all swimmers not participating in this event recover fatigue
    // based on 1 event gap
    clubs.forEach(club => {
      club.swimmers.forEach(swimmer => {
        const isSwimmingNow = results.some(r =>
          (!r.isRelay && r.swimmer?.id === swimmer.id) ||
          (r.isRelay && r.swimmers?.some(s => s.id === swimmer.id))
        );

        if (!isSwimmingNow) {
          swimmer.recoverBetweenEvents(1, club.getEquipmentRecoveryBonus());
        }
      });
    });

    return {
      event,
      division,
      results
    };
  }

  /**
   * Resolves the official point array for an event
   */
  static getScoringTable(division, isFinalPhase, clubCount, isRelay) {
    if (!isFinalPhase) {
      if (division === DIVISIONS.DIV3 || clubCount > 6) {
        return isRelay
          ? SCORING_RULES.PRELIM_POINTS_7_PLUS_CLUBS.RELAY
          : SCORING_RULES.PRELIM_POINTS_7_PLUS_CLUBS.INDIVIDUAL;
      } else {
        return isRelay
          ? SCORING_RULES.PRELIM_POINTS_6_CLUBS.RELAY
          : SCORING_RULES.PRELIM_POINTS_6_CLUBS.INDIVIDUAL;
      }
    } else {
      if (division === DIVISIONS.DIV3) {
        return isRelay
          ? SCORING_RULES.FINAL_POINTS_DIV3.RELAY
          : SCORING_RULES.FINAL_POINTS_DIV3.INDIVIDUAL;
      } else {
        return isRelay
          ? SCORING_RULES.FINAL_POINTS_HONRA_1_2.RELAY
          : SCORING_RULES.FINAL_POINTS_HONRA_1_2.INDIVIDUAL;
      }
    }
  }

  /**
   * Compute positions at time elapsed t for 2D animated pool graphics
   * Pool length is 25 meters.
   * Total length = event.distance (e.g. 50m = 2 lengths, 100m = 4 lengths, etc.)
   */
  static getLiveStateAtTime(results, event, elapsedSeconds) {
    const totalDist = event.distance;
    const poolLength = 25; // standard short course pool
    const numLaps = totalDist / poolLength;

    return results.map(res => {
      const finalTime = res.finalTime;
      const progressFraction = Math.min(1.0, elapsedSeconds / finalTime);
      const currentDistance = progressFraction * totalDist;

      // Current lap index: 0, 1, 2...
      const currentLap = Math.min(numLaps - 1, Math.floor(currentDistance / poolLength));
      const distInCurrentLap = currentDistance - currentLap * poolLength;

      // Is swimming left-to-right (even lap) or right-to-left (odd lap)
      const isGoingRight = (currentLap % 2 === 0);
      const lapFraction = distInCurrentLap / poolLength;

      // Normalised X coordinate in pool: 0.0 (left wall) to 1.0 (right wall)
      const poolX = isGoingRight ? lapFraction : (1.0 - lapFraction);

      const isFinished = progressFraction >= 1.0;

      // Stroke phase cycle (arms & kicks) based on stroke tempo (~0.9s per stroke cycle)
      const strokeCycleTime = event.stroke === STROKES.FLY ? 0.95 : event.stroke === STROKES.BREAST ? 1.1 : 0.82;
      const strokePhase = (elapsedSeconds % strokeCycleTime) / strokeCycleTime; // 0 to 1

      // Turn animation: within 1 meter of turn
      const nearTurn = !isFinished && (distInCurrentLap > 24.2 || distInCurrentLap < 0.8);

      return {
        ...res,
        progressFraction,
        currentDistance,
        currentLap,
        poolX,
        isGoingRight,
        isFinished,
        strokePhase,
        nearTurn
      };
    });
  }
}
