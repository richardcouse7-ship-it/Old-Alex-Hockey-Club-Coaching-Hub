import React, { useState, useEffect } from 'react';
import {
  Trophy,
  X,
  Check,
  Share2,
  Clock,
  Shield,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';
import { MatchFixture } from '../../types';

interface QuickScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  fixture: MatchFixture | null;
  onSaveResult: (updatedFixture: MatchFixture) => void;
}

export const QuickScoreModal: React.FC<QuickScoreModalProps> = ({
  isOpen,
  onClose,
  fixture,
  onSaveResult,
}) => {
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [matchStatus, setMatchStatus] = useState<
    'Scheduled' | 'In Progress' | 'Completed' | 'Postponed'
  >('Completed');
  const [goalscorers, setGoalscorers] = useState<string>('');
  const [matchNotes, setMatchNotes] = useState<string>('');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  useEffect(() => {
    if (fixture) {
      // Parse existing result if available (e.g., "3 - 1" or "3-1")
      if (fixture.homeScore !== undefined && fixture.awayScore !== undefined) {
        setHomeScore(fixture.homeScore);
        setAwayScore(fixture.awayScore);
      } else if (fixture.result) {
        const parts = fixture.result.split('-').map((s) => parseInt(s.trim(), 10));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          if (fixture.isHome) {
            setHomeScore(parts[0]);
            setAwayScore(parts[1]);
          } else {
            setAwayScore(parts[0]);
            setHomeScore(parts[1]);
          }
        }
      } else {
        setHomeScore(0);
        setAwayScore(0);
      }

      setMatchStatus(fixture.status || 'Completed');
      setGoalscorers(fixture.goalscorers || '');
      setMatchNotes(fixture.notes || '');
      setCopiedWhatsApp(false);
    }
  }, [fixture, isOpen]);

  if (!isOpen || !fixture) return null;

  const alexTeamName = fixture.ageGroupOrTeam;
  const oppTeamName = fixture.opposition;

  // If fixture is home: Alex is home, Opp is away.
  // If fixture is away: Opp is home, Alex is away.
  const alexScore = fixture.isHome ? homeScore : awayScore;
  const oppScore = fixture.isHome ? awayScore : homeScore;

  const handleAlexScoreChange = (delta: number) => {
    if (fixture.isHome) {
      setHomeScore((prev) => Math.max(0, prev + delta));
    } else {
      setAwayScore((prev) => Math.max(0, prev + delta));
    }
  };

  const handleOppScoreChange = (delta: number) => {
    if (fixture.isHome) {
      setAwayScore((prev) => Math.max(0, prev + delta));
    } else {
      setHomeScore((prev) => Math.max(0, prev + delta));
    }
  };

  const formattedResultString = `${alexScore} - ${oppScore}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: MatchFixture = {
      ...fixture,
      homeScore,
      awayScore,
      result: formattedResultString,
      status: matchStatus,
      goalscorers: goalscorers.trim(),
      notes: matchNotes.trim(),
    };

    onSaveResult(updated);
    onClose();
  };

  const generateWhatsAppMessage = () => {
    const outcome =
      alexScore > oppScore
        ? 'WIN 🏆'
        : alexScore < oppScore
        ? 'FULL TIME'
        : 'DRAW 🤝';

    return `🏑 *OLD ALEX HC — MATCH RESULT (${outcome})* 🏑
🏆 *${fixture.competition}*
📅 *Date:* ${fixture.date} (${fixture.pushbackTime})
📍 *Venue:* ${fixture.venue}

⭐️ *${alexTeamName}*  ${alexScore} - ${oppScore}  *${oppTeamName}*

${goalscorers.trim() ? `⚽ *Goalscorers:* ${goalscorers.trim()}\n` : ''}${
      matchNotes.trim() ? `📝 *Match Summary:* ${matchNotes.trim()}\n` : ''
    }
Well played everyone! Up Old Alex! 💜💛
`;
  };

  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-black border border-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-md">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono-data text-red-500 font-bold uppercase tracking-wider">
                Leinster Match Center
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Quick Score & Result Logger
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fixture Banner */}
        <div className="px-6 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs">
          <div>
            <span className="font-mono-data text-[10px] text-red-400 uppercase font-bold">
              {fixture.competition}
            </span>
            <div className="text-neutral-300 font-medium">
              {fixture.date} · {fixture.pushbackTime} · {fixture.venue}
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              fixture.isHome
                ? 'bg-neutral-950 text-emerald-300 border border-emerald-800'
                : 'bg-neutral-800 text-white'
            }`}
          >
            {fixture.isHome ? 'HOME' : 'AWAY'}
          </span>
        </div>

        {/* Score Logging Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs bg-black">
          {/* Visual Scoreboard Stepper */}
          <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 grid grid-cols-5 items-center gap-2">
            {/* Old Alex Side */}
            <div className="col-span-2 text-center space-y-2">
              <span className="text-white font-bold block truncate text-xs">
                {alexTeamName}
              </span>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAlexScoreChange(-1)}
                  className="w-8 h-8 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center border border-neutral-750 active:scale-95 transition-all"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-3xl font-extrabold text-white font-mono-data w-10 text-center">
                  {alexScore}
                </span>
                <button
                  type="button"
                  onClick={() => handleAlexScoreChange(1)}
                  className="w-8 h-8 rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-md active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[10px] text-red-400 uppercase font-mono-data block font-bold">
                Old Alexandra
              </span>
            </div>

            {/* VS Divider */}
            <div className="col-span-1 text-center">
              <span className="text-neutral-500 font-extrabold text-sm block">VS</span>
              <span className="text-[10px] font-mono-data text-neutral-400">FT</span>
            </div>

            {/* Opposition Side */}
            <div className="col-span-2 text-center space-y-2">
              <span className="text-white font-bold block truncate text-xs">
                {oppTeamName}
              </span>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOppScoreChange(-1)}
                  className="w-8 h-8 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center border border-neutral-750 active:scale-95 transition-all"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-3xl font-extrabold text-white font-mono-data w-10 text-center">
                  {oppScore}
                </span>
                <button
                  type="button"
                  onClick={() => handleOppScoreChange(1)}
                  className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center shadow-md active:scale-95 transition-all border border-neutral-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[10px] text-neutral-400 uppercase font-mono-data block font-bold">
                Opposition
              </span>
            </div>
          </div>

          {/* Match Status Segmented Selector */}
          <div>
            <label className="text-white font-semibold block mb-1.5">
              Match Status
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Completed', 'In Progress', 'Scheduled', 'Postponed'] as const).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setMatchStatus(status)}
                    className={`py-2 px-1 text-center rounded-xl font-bold transition-all text-[11px] ${
                      matchStatus === status
                        ? status === 'Completed'
                          ? 'bg-red-600 text-white shadow-md'
                          : status === 'In Progress'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-neutral-800 text-white border border-neutral-700'
                        : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Goalscorers Field */}
          <div>
            <label className="text-white font-semibold block mb-1">
              Goalscorers (Old Alex)
            </label>
            <input
              type="text"
              value={goalscorers}
              onChange={(e) => setGoalscorers(e.target.value)}
              placeholder="e.g. Sarah Kelly (2), Emma Murphy (PC strike)"
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Match Summary / Coach Notes */}
          <div>
            <label className="text-white font-semibold block mb-1">
              Match Report / Tactical Highlights
            </label>
            <textarea
              rows={2}
              value={matchNotes}
              onChange={(e) => setMatchNotes(e.target.value)}
              placeholder="e.g. Great high press in Q3, clean sheet for Sophie in goal, clinical baseline crosses."
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl p-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                copiedWhatsApp
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-white'
              }`}
            >
              {copiedWhatsApp ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>{copiedWhatsApp ? 'Copied WhatsApp Result!' : 'WhatsApp Result'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-750 rounded-xl font-medium"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Save Final Result</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
