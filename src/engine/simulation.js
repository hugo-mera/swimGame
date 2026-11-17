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
          lane: idx + 1,
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
          lane: idx + 1,
          finalTime,
          isPB
        };
      }
    });

    // 3. Sort by finalTime ascending (fastest first)
    results.sort((a, b) => a.finalTime - b.finalTime);

    // Keep lanes in deterministic club/entry order; final ranking is shown separately.
    results.forEach((res, rankIdx) => {
      res.rank = rankIdx + 1;
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
   * Implements realistic swimming split pacing & lead changes during the race
   * Pool length is 25 meters.
   */
  static getLiveStateAtTime(results, event, elapsedSeconds) {
    const totalDist = event.distance;
    const poolLength = 25; // standard short course pool
    const numLaps = totalDist / poolLength;

    const rawStates = results.map((res, resIdx) => {
      const finalTime = res.finalTime;
      let currentDistance = 0;
      let isFinished = false;
      let currentStroke = event.stroke;
      let activeSwimmerName = res.swimmerName;

      if (elapsedSeconds >= finalTime) {
        currentDistance = totalDist;
        isFinished = true;
      } else if (res.isRelay && res.legSplits && res.legSplits.length === 4) {
        // Realistic Relay Pacing: each of the 4 legs follows its specific swimmer's speed
        const legDist = totalDist / 4;
        let cumulativeTime = 0;
        let legStartDist = 0;

        for (let legIdx = 0; legIdx < 4; legIdx++) {
          const leg = res.legSplits[legIdx];
          const legT = leg.time;
          const legEndTime = cumulativeTime + legT;

          if (elapsedSeconds < legEndTime || legIdx === 3) {
            currentStroke = leg.stroke || event.stroke;
            activeSwimmerName = leg.swimmerName;
            const timeInLeg = Math.max(0, elapsedSeconds - cumulativeTime);
            const legTau = Math.min(1.0, timeInLeg / legT);
            // Intra-leg acceleration/pacing
            const legWave = Math.sin(Math.PI * legTau) * 0.02 * Math.sin(2 * Math.PI * legTau);
            const legProgress = Math.max(0, Math.min(1.0, legTau + legWave));
            currentDistance = legStartDist + legProgress * legDist;
            break;
          }

          cumulativeTime += legT;
          legStartDist += legDist;
        }
      } else {
        // Realistic Individual Pacing: split curves, turn bonuses, and surge phases
        const tau = Math.min(1.0, elapsedSeconds / finalTime);
        const swimmer = res.swimmer;
        const specialty = swimmer ? swimmer.specialty : (resIdx % 2 === 0 ? 'sprint' : 'distance');
        const seed = (res.lane || (resIdx + 1)) * 1.618;

        // Front-half bias (sprinters go out faster, distance swimmers surge in 2nd half)
        const paceBias = specialty === 'sprint'
          ? Math.sin(Math.PI * tau) * 0.022
          : -Math.sin(Math.PI * tau) * 0.018;

        // Micro-surge wave: creates realistic lead changes throughout the race
        const waveCycles = Math.max(2, Math.round(numLaps));
        const surgeWave = Math.sin(2 * Math.PI * waveCycles * tau + seed) * 0.014 * Math.sin(Math.PI * tau);
        
        const progressFraction = Math.max(0, Math.min(1.0, tau + paceBias + surgeWave));
        currentDistance = progressFraction * totalDist;
      }

      currentDistance = Math.min(totalDist, Math.max(0, currentDistance));
      const progressFraction = currentDistance / totalDist;

      // Current lap index: 0, 1, 2...
      const currentLap = Math.min(numLaps - 1, Math.floor(currentDistance / poolLength));
      const distInCurrentLap = currentDistance - currentLap * poolLength;

      // Is swimming left-to-right (even lap) or right-to-left (odd lap)
      const isGoingRight = (currentLap % 2 === 0);
      const lapFraction = Math.min(1.0, Math.max(0, distInCurrentLap / poolLength));

      // Normalised X coordinate in pool: 0.0 (left wall) to 1.0 (right wall)
      const poolX = isGoingRight ? lapFraction : (1.0 - lapFraction);

      // Stroke phase cycle
      const strokeCycleTime = currentStroke === STROKES.FLY ? 0.95 : currentStroke === STROKES.BREAST ? 1.1 : 0.82;
      const strokePhase = (elapsedSeconds % strokeCycleTime) / strokeCycleTime;

      // Turn animation: within 1 meter of turn
      const nearTurn = !isFinished && (distInCurrentLap > 24.2 || distInCurrentLap < 0.8);

      return {
        ...res,
        currentStroke,
        activeSwimmerName,
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

    // Compute live positions/ranks in the water
    const sortedByDistance = [...rawStates].sort((a, b) => {
      if (a.isFinished && b.isFinished) return a.finalTime - b.finalTime;
      if (a.isFinished) return -1;
      if (b.isFinished) return 1;
      return b.currentDistance - a.currentDistance;
    });

    const rankMap = new Map();
    sortedByDistance.forEach((item, idx) => {
      rankMap.set(item.id, idx + 1);
    });

    return rawStates.map(state => ({
      ...state,
      liveRank: rankMap.get(state.id) || state.rank,
      isLeading: (rankMap.get(state.id) === 1)
    }));
  }
}
