// Full 36-Week Season Simulation Test
import { DIVISIONS, DIFFICULTY_PRESETS, MEET_PROGRAMS } from './src/constants.js';
import { LeagueEngine } from './src/engine/league.js';

console.log('🏊 Testing Full 36-Week Season Simulation...');

const engine = new LeagueEngine(DIFFICULTY_PRESETS.NORMAL);
engine.initializeClubs({ name: 'CN Riazor', city: 'A Coruña' });

console.log(`Starting Season: ${engine.currentSeasonYear}, Clubs initialized.`);

for (let week = 1; week <= 36; week++) {
  const currentEvent = engine.getCurrentScheduleEvent();

  if (currentEvent.type === 'meet') {
    console.log(`\n📅 Week ${week}: Simulating ${currentEvent.name}...`);
    // Prepare AI entries for all divisions and simulate
    Object.keys(engine.divisions).forEach(divName => {
      engine.prepareAIMeetEntries(currentEvent.program, false);
      const res = engine.simulateDivisionMeet(divName, currentEvent.program, false);
      if (divName === DIVISIONS.DIV3) {
        console.log(`   Div 3 Standings after ${currentEvent.name}: Top club: ${res.clubStandingsThisMeet[0].club.name} (+${res.clubStandingsThisMeet[0].xornadaPointsEarned} pts)`);
      }
    });
  } else if (currentEvent.type === 'prelim_resolution') {
    console.log(`\n📊 Week ${week}: Resolving Preliminary Phase...`);
    const splitReport = engine.resolvePreliminaryPhase();
    console.log(`   3ª Div Qualified for Title Final: ${splitReport[DIVISIONS.DIV3].titleGroup.map(c => c.name).join(', ')}`);
  } else if (currentEvent.type === 'final_meet') {
    console.log(`\n🏁 Week ${week}: Simulating Gran Fase Final (Sesión 1 & 2)...`);
    Object.keys(engine.divisions).forEach(divName => {
      // Session 1
      engine.prepareAIMeetEntries(MEET_PROGRAMS.FASE_FINAL_S1, true);
      engine.simulateDivisionMeet(divName, MEET_PROGRAMS.FASE_FINAL_S1, true);
      // Session 2
      engine.prepareAIMeetEntries(MEET_PROGRAMS.FASE_FINAL_S2, true);
      engine.simulateDivisionMeet(divName, MEET_PROGRAMS.FASE_FINAL_S2, true);
    });
  } else if (currentEvent.type === 'season_end_ceremony') {
    console.log(`\n🏆 Week ${week}: Season End Ceremony! Finalizing Promotions & Relegations...`);
    const outcome = engine.finalizeSeason();
    console.log('   Promotions & Relegations:');
    outcome.promotionRelegationLog.forEach(log => {
      console.log(`     - [${log.type}] ${log.clubName}: ${log.from} -> ${log.to}`);
    });
    console.log(`   Trofeo Leopoldo Bremón (Masc): ${outcome.bestSwimmers.topMale?.swimmer.fullName} (${outcome.bestSwimmers.topMale?.clubName}) with ${outcome.bestSwimmers.topMale?.points} pts`);
    console.log(`   Trofeo Leopoldo Bremón (Fem): ${outcome.bestSwimmers.topFemale?.swimmer.fullName} (${outcome.bestSwimmers.topFemale?.clubName}) with ${outcome.bestSwimmers.topFemale?.points} pts`);
  }

  // Advance week
  if (week < 36) {
    engine.advanceWeek();
  }
}

console.log('\n✅ Full Season Simulation Completed Successfully!');
