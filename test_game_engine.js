// Comprehensive Automated Unit Test for Swim Game Engine
import { DIVISIONS, MEET_PROGRAMS, DIFFICULTY_PRESETS, PERIODIZATION_PHASES } from './src/constants.js';
import { Swimmer } from './src/models/Swimmer.js';
import { Club } from './src/models/Club.js';
import { AICoach } from './src/engine/ai.js';
import { RaceSimulation } from './src/engine/simulation.js';
import { LeagueEngine } from './src/engine/league.js';

function assert(condition, message) {
  if (!condition) {
    console.error('❌ Assertion failed:', message);
    process.exit(1);
  } else {
    console.log('✅ Passed:', message);
  }
}

console.log('🧪 Starting Swim Game Engine Tests...\n');

// 1. Swimmer Model Tests
const testSwimmer = new Swimmer({
  firstName: 'Brais',
  lastName: 'Vázquez',
  gender: 'M',
  age: 19,
  stats: {
    speed: 80,
    distance: 70,
    strength: 75,
    freestyle: 85,
    backstroke: 60,
    breaststroke: 55,
    butterfly: 65,
    IM: 70
  }
});

assert(testSwimmer.fullName === 'Brais Vázquez', 'Swimmer full name should match');
assert(testSwimmer.overallRating > 0, `Swimmer overall rating is valid: ${testSwimmer.overallRating}`);

const event50Free = { id: 'E1', name: '50 m Libre Mas.', gender: 'M', distance: 50, stroke: 'freestyle' };
const est50 = testSwimmer.getEstimatedTime(event50Free);
assert(est50 >= 21.0 && est50 <= 32.0, `Estimated 50m Free is realistic: ${est50}s`);

// Fatigue test
const initialFatigue = testSwimmer.raceMeetFatigue;
testSwimmer.addRaceFatigue(100);
assert(testSwimmer.raceMeetFatigue > initialFatigue, `Race fatigue increased: ${testSwimmer.raceMeetFatigue}`);
testSwimmer.recoverBetweenEvents(5, 0.2);
assert(testSwimmer.raceMeetFatigue < 25, `Fatigue recovered between events: ${testSwimmer.raceMeetFatigue}`);

// 2. Club Model & Equipment Tests
const testClub = new Club({
  name: 'CN Riazor',
  city: 'A Coruña',
  division: DIVISIONS.DIV3,
  funds: 10000
});

testClub.addSwimmer(testSwimmer);
assert(testClub.swimmers.length === 1, 'Swimmer successfully added to club');
assert(testSwimmer.clubId === testClub.id, 'Swimmer clubId assigned');

const buyRes = testClub.buyEquipment('pull_kick');
assert(buyRes.success || testClub.hasEquipment('pull_kick'), 'Equipment purchase or ownership confirmed');
assert(testClub.getEquipmentTrainingBonus() >= 0.05, `Training bonus calculated: ${testClub.getEquipmentTrainingBonus()}`);

// 3. AI Coach Roster Optimization Tests
const engine = new LeagueEngine(DIFFICULTY_PRESETS.NORMAL);
engine.initializeClubs();

const div3Clubs = engine.divisions[DIVISIONS.DIV3];
const playerClub = engine.playerClub;
assert(playerClub !== null, 'Player club initialized in Div 3');
assert(playerClub.swimmers.length >= 10, `Player club has sufficient squad depth: ${playerClub.swimmers.length}`);

// Test AI roster selection on Jornada A
const rosterResult = AICoach.generateMeetRoster(
  playerClub,
  MEET_PROGRAMS.XORNADA_A,
  false,
  1.0,
  div3Clubs.length
);

assert(rosterResult.entries !== undefined, 'AI Coach generated entries');

// Verify FEGAN Participation Rules
let violationFound = false;
const swimmerCounts = {};

Object.entries(rosterResult.entries).forEach(([evId, enteredIds]) => {
  const ev = MEET_PROGRAMS.XORNADA_A.find(e => e.id === evId);
  if (!ev.isRelay) {
    // Check max individual entries per event
    if (enteredIds.length > 2) {
      violationFound = true;
      console.error(`Violation: >2 swimmers in individual event ${ev.name}`);
    }
    // Check 3ª division distance limit (only 1 swimmer in 400m when >6 clubs)
    if ([400, 800, 1500].includes(ev.distance) && div3Clubs.length > 6 && enteredIds.length > 1) {
      violationFound = true;
      console.error(`Violation: >1 swimmer in distance event ${ev.name} in Div 3`);
    }

    enteredIds.forEach(sId => {
      swimmerCounts[sId] = (swimmerCounts[sId] || 0) + 1;
      if (swimmerCounts[sId] > 2) {
        violationFound = true;
        console.error(`Violation: swimmer ${sId} entered in >2 individual events in this session`);
      }
    });
  } else {
    // Relays must have up to 4 swimmers
    assert(enteredIds.length <= 4, `Relay event ${ev.name} has valid squad size: ${enteredIds.length}`);
  }
});

assert(!violationFound, 'AI Coach strictly adhered to all FEGAN Circular 26-14 rules!');

// 4. Race Simulation Tests
playerClub.currentMeetEntries = rosterResult.entries;
engine.prepareAIMeetEntries(MEET_PROGRAMS.XORNADA_A, false);

const simResult = RaceSimulation.simulateEvent({
  event: MEET_PROGRAMS.XORNADA_A[2], // 400m Libre Fem
  division: DIVISIONS.DIV3,
  clubs: div3Clubs,
  isFinalPhase: false,
  eventIndex: 2
});

assert(simResult.results.length > 0, `Race simulated with ${simResult.results.length} participants`);
assert(simResult.results[0].rank === 1, 'First place ranked #1');
assert(simResult.results[0].points > 0, `Winner awarded FEGAN points: ${simResult.results[0].points} pts`);

// 5. Full Meet & League Progression Test
console.log('\nSimulating Full Division Meet (Jornada A)...');
const meetSummary = engine.simulateDivisionMeet(DIVISIONS.DIV3, MEET_PROGRAMS.XORNADA_A, false);
assert(meetSummary.clubStandingsThisMeet.length === div3Clubs.length, 'All clubs ranked in Jornada');
assert(meetSummary.clubStandingsThisMeet[0].xornadaPointsEarned > 0, `Xornada winner earned rank points: ${meetSummary.clubStandingsThisMeet[0].xornadaPointsEarned}`);

// Test Weekly Advance & Periodization
console.log('\nTesting Weekly Periodization Progression...');
const initialSpeed = playerClub.swimmers[0].stats.speed;
engine.advanceWeek();
assert(engine.currentWeek === 2, `Advanced to Week ${engine.currentWeek}`);

// 6. Test Load Contemporization & Custom Periodization
console.log('\nTesting Coach Load Contemporization...');
// Artificially increase fatigue
playerClub.swimmers[0].chronicFatigue = 60;
playerClub.swimmers[0].acuteFatigue = 60;

// Coach sets current week (Week 2) to Taper/Descarga
playerClub.setWeeklyPhase(2, 'taper');
const currentEv = engine.getCurrentScheduleEvent();
assert(currentEv.phase.id === 'taper', 'Current schedule event returns custom taper phase');
assert(currentEv.isCustomPhase === true, 'isCustomPhase marked true');

engine.advanceWeek(); // Processes Week 2 with Taper
assert(playerClub.swimmers[0].chronicFatigue < 60, `Fatigue cleared during coach-scheduled Taper: ${playerClub.swimmers[0].chronicFatigue}`);

// Test Batch setting
playerClub.setBatchWeeklyPhases(10, 14, 'specific');
assert(playerClub.customWeeklyPhases[10] === 'specific' && playerClub.customWeeklyPhases[14] === 'specific', 'Batch range weeks set to specific');

// Test Auto Tapers setup before all 4 meets
playerClub.setupAutoMeetTapers(engine.schedule);
assert(playerClub.customWeeklyPhases[8] === 'taper', 'Week 8 auto-set to taper before Jornada A');
assert(playerClub.customWeeklyPhases[17] === 'taper', 'Week 17 auto-set to taper before Jornada B');
assert(playerClub.customWeeklyPhases[25] === 'taper', 'Week 25 auto-set to taper before Jornada C');
assert(playerClub.customWeeklyPhases[33] === 'taper', 'Week 33 auto-set to taper before Fase Final');

console.log('✅ All Coach Load Contemporization tests passed!');

console.log('\n🎉 ALL UNIT TESTS PASSED WITH 100% SUCCESS!\n');
