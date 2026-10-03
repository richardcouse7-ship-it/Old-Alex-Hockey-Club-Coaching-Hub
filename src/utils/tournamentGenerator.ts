import { BlitzMatch, BlitzStanding, BlitzTeam, BlitzTournament } from '../types';

export const MILLTOWN_SECTORS = [
  { id: 'sector-a', label: 'Sector A (SW Turf)' },
  { id: 'sector-b', label: 'Sector B (NW Turf)' },
  { id: 'sector-c', label: 'Sector C (SE Turf)' },
  { id: 'sector-d', label: 'Sector D (NE Turf)' },
];

export const PRESET_BLITZ_TEAMS: BlitzTeam[] = [
  { id: 'team-red', name: 'Red Robins', color: '#dc2626', coachName: 'Hannah McDermott' },
  { id: 'team-white', name: 'White Tigers', color: '#f8fafc', coachName: 'Sophie Marshall' },
  { id: 'team-dodder', name: 'Dodder Hawks', color: '#0284c7', coachName: 'Rachel Henderson' },
  { id: 'team-milltown', name: 'Milltown Foxes', color: '#ea580c', coachName: 'Alex McGonigle' },
  { id: 'team-badgers', name: 'Alex Badgers', color: '#16a34a', coachName: 'Aoife Kelly' },
  { id: 'team-stags', name: 'Dublin Stags', color: '#9333ea', coachName: 'Ciara O’Shea' },
];

/**
 * Generate a round-robin schedule for a set of teams.
 * Uses the circle/polygon algorithm. If odd number of teams, adds a BYE.
 */
export function generateRoundRobinMatches(
  teams: BlitzTeam[],
  startTime: string = '09:30',
  matchDurationMinutes: number = 12,
  breakDurationMinutes: number = 3
): BlitzMatch[] {
  if (teams.length < 2) return [];

  const teamList = [...teams];
  const isOdd = teamList.length % 2 !== 0;
  if (isOdd) {
    teamList.push({ id: 'BYE', name: 'Rest / Bye', color: '#6b7280' });
  }

  const numTeams = teamList.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;
  const matches: BlitzMatch[] = [];

  // Parse start time
  const [startHour, startMin] = startTime.split(':').map((v) => parseInt(v, 10));
  let currentMinutesFromMidnight = (isNaN(startHour) ? 9 : startHour) * 60 + (isNaN(startMin) ? 30 : startMin);

  // Rotation array
  const rotators = [...teamList];

  for (let r = 0; r < numRounds; r++) {
    const roundNumber = r + 1;
    const hours = Math.floor(currentMinutesFromMidnight / 60);
    const mins = currentMinutesFromMidnight % 60;
    const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

    for (let m = 0; m < matchesPerRound; m++) {
      const home = rotators[m];
      const away = rotators[numTeams - 1 - m];

      // Skip match if either team is the BYE dummy team
      if (home.id === 'BYE' || away.id === 'BYE') continue;

      const sector = MILLTOWN_SECTORS[m % MILLTOWN_SECTORS.length];

      matches.push({
        id: `match-r${roundNumber}-m${m + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        roundNumber,
        pitchSectorId: sector.id,
        pitchSectorLabel: sector.label,
        scheduledTime: timeStr,
        homeTeamId: home.id,
        awayTeamId: away.id,
        status: 'Scheduled',
      });
    }

    // Advance time for next round
    currentMinutesFromMidnight += matchDurationMinutes + breakDurationMinutes;

    // Rotate elements, keeping index 0 fixed
    const fixed = rotators[0];
    const rest = rotators.slice(1);
    const last = rest.pop()!;
    rest.unshift(last);
    rotators.splice(0, rotators.length, fixed, ...rest);
  }

  return matches;
}

/**
 * Calculate live standings table from completed matches
 */
export function calculateBlitzStandings(
  teams: BlitzTeam[],
  matches: BlitzMatch[]
): BlitzStanding[] {
  const standingsMap: Record<string, BlitzStanding> = {};

  for (const t of teams) {
    if (t.id === 'BYE') continue;
    standingsMap[t.id] = {
      teamId: t.id,
      teamName: t.name,
      teamColor: t.color,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };
  }

  for (const m of matches) {
    if (m.homeScore !== undefined && m.awayScore !== undefined) {
      const home = standingsMap[m.homeTeamId];
      const away = standingsMap[m.awayTeamId];
      if (!home || !away) continue;

      home.played += 1;
      away.played += 1;

      home.goalsFor += m.homeScore;
      home.goalsAgainst += m.awayScore;
      away.goalsFor += m.awayScore;
      away.goalsAgainst += m.homeScore;

      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;

      if (m.homeScore > m.awayScore) {
        home.won += 1;
        home.points += 3;
        away.lost += 1;
      } else if (m.homeScore < m.awayScore) {
        away.won += 1;
        away.points += 3;
        home.lost += 1;
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.points += 1;
        away.points += 1;
      }
    }
  }

  return Object.values(standingsMap).sort((a, b) => {
    // 1. Points
    if (b.points !== a.points) return b.points - a.points;
    // 2. Goal Difference
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    // 3. Goals Scored
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    // 4. Alphabetical
    return a.teamName.localeCompare(b.teamName);
  });
}

/**
 * Format WhatsApp tournament bulletin
 */
export function generateBlitzWhatsAppReport(tournament: BlitzTournament): string {
  const standings = calculateBlitzStandings(tournament.teams, tournament.matches);
  const totalMatches = tournament.matches.length;
  const completedMatches = tournament.matches.filter(
    (m) => m.homeScore !== undefined && m.awayScore !== undefined
  ).length;

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];

  let report = `🏑 *OLD ALEXANDRA HC — SUNDAY JUNIOR BLITZ* 🏑\n`;
  report += `📍 *Venue:* Milltown Astro Pitch Quadrants\n`;
  report += `📅 *Date:* ${tournament.date} · *Age Group:* ${tournament.ageGroup}\n`;
  report += `🏆 *Tournament:* ${tournament.title}\n`;
  report += `⏱️ *Format:* ${tournament.matchDurationMinutes} min games · ${tournament.teams.length} Teams\n`;
  report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  report += `📊 *LIVE TOURNAMENT STANDINGS:*\n`;
  standings.forEach((st, idx) => {
    const medal = medals[idx] || `${idx + 1}.`;
    const gdSign = st.goalDifference > 0 ? `+${st.goalDifference}` : `${st.goalDifference}`;
    report += `${medal} *${st.teamName}* — ${st.points} pts (P:${st.played} W:${st.won} D:${st.drawn} L:${st.lost} GD:${gdSign})\n`;
  });

  report += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  report += `📋 *ROUND-BY-ROUND RESULTS:*\n`;

  const rounds = Array.from(new Set(tournament.matches.map((m) => m.roundNumber))).sort((a, b) => a - b);
  for (const r of rounds) {
    const roundMatches = tournament.matches.filter((m) => m.roundNumber === r);
    report += `\n*Round ${r} (${roundMatches[0]?.scheduledTime || ''}):*\n`;
    for (const m of roundMatches) {
      const home = tournament.teams.find((t) => t.id === m.homeTeamId)?.name || 'Home';
      const away = tournament.teams.find((t) => t.id === m.awayTeamId)?.name || 'Away';
      const score =
        m.homeScore !== undefined && m.awayScore !== undefined
          ? `${m.homeScore} - ${m.awayScore}`
          : 'Pending';
      report += `• ${m.pitchSectorLabel.split(' ')[0]} ${m.pitchSectorLabel.split(' ')[1]}: ${home} ${score} ${away}\n`;
    }
  }

  report += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  report += `👏 Great effort and sportsmanship by all Old Alex players!\n`;
  report += `_Generated via Old Alex Coaching Hub · Milltown_`;

  return report;
}
