import React, { useState } from 'react';
import {
  ShieldAlert,
  Package,
  CheckCircle,
  Plus,
  AlertTriangle,
  Clock,
  HeartPulse,
  ThermometerSnowflake,
  Check,
  X,
  MapPin,
  ClipboardList,
} from 'lucide-react';
import { AgeGroup, FirstAidIncident, SectorGearAllocation } from '../../types';

interface KitShedAndSafetyViewProps {
  gearAllocations: SectorGearAllocation[];
  firstAidIncidents: FirstAidIncident[];
  onUpdateGear: (updated: SectorGearAllocation[]) => void;
  onUpdateFirstAid: (updated: FirstAidIncident[]) => void;
  selectedDate: string;
}

export const KitShedAndSafetyView: React.FC<KitShedAndSafetyViewProps> = ({
  gearAllocations,
  firstAidIncidents,
  onUpdateGear,
  onUpdateFirstAid,
  selectedDate,
}) => {
  const [activeTab, setActiveTab] = useState<'gear' | 'safety'>('gear');
  const [icePacksInFreezer, setIcePacksInFreezer] = useState(12);
  const [showLogIncidentModal, setShowLogIncidentModal] = useState(false);

  // New incident form
  const [incTime, setIncTime] = useState('11:20');
  const [incGroup, setIncGroup] = useState<AgeGroup>('3rd Class');
  const [incSector, setIncSector] = useState('P2S');
  const [incPlayer, setIncPlayer] = useState('');
  const [incType, setIncType] = useState<FirstAidIncident['incidentType']>('Stick Strike');
  const [incTreatment, setIncTreatment] = useState('Applied ice pack to left knee. Rested 5 mins.');
  const [incParentNotified, setIncParentNotified] = useState(true);
  const [incCoach, setIncCoach] = useState('Bo Hunter');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleToggleReturn = (gearId: string) => {
    const updated = gearAllocations.map((g) =>
      g.id === gearId ? { ...g, isReturned: !g.isReturned } : g
    );
    onUpdateGear(updated);
  };

  const handleReturnAll = () => {
    const updated = gearAllocations.map((g) => ({ ...g, isReturned: true }));
    onUpdateGear(updated);
    setSuccessToast('All sector gear bags confirmed returned & locked in Milltown shed.');
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleLogIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incPlayer.trim()) return;

    const newIncident: FirstAidIncident = {
      id: `fa-${Date.now()}`,
      date: selectedDate,
      time: incTime,
      ageGroupId: incGroup,
      pitchSectorId: incSector,
      playerName: incPlayer,
      incidentType: incType,
      treatment: incTreatment,
      parentNotified: incParentNotified,
      loggedByCoach: incCoach,
    };

    const next = [newIncident, ...firstAidIncidents];
    onUpdateFirstAid(next);
    setShowLogIncidentModal(false);
    setIncPlayer('');
    setSuccessToast(`Incident logged for ${incPlayer}. Parent notification recorded.`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const returnedCount = gearAllocations.filter((g) => g.isReturned).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black border border-neutral-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-data text-red-400 font-semibold uppercase tracking-wider">
              Club Facilities & Welfare
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-xs text-neutral-400">Milltown AstroTurf Gear Pavilion</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
            <Package className="w-6 h-6 text-red-500" />
            <span>Kit Shed Inventory & Pitch First Aid</span>
          </h1>
          <p className="text-xs text-neutral-300 mt-1">
            Track ball bag checkouts across pitch sectors and log safety incidents & ice pack inventory.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
          <button
            type="button"
            onClick={() => setActiveTab('gear')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'gear'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Sector Gear (4A)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('safety')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'safety'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>First Aid & Safety (4B)</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {successToast && (
        <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-xl text-xs text-white flex items-center gap-2">
          <Check className="w-4 h-4 text-red-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Tab 1: Sector Gear Allocation */}
      {activeTab === 'gear' && (
        <div className="space-y-6">
          {/* Summary Status Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-black border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-400 font-medium">Total Gear Bags</span>
                <div className="text-2xl font-bold text-white font-mono-data mt-1">5 Sectors</div>
                <span className="text-[10px] text-neutral-400">P1N, P1S, P2N, P2S, P3</span>
              </div>
              <Package className="w-8 h-8 text-red-500 opacity-80" />
            </div>

            <div className="bg-black border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-400 font-medium">Shed Return Status</span>
                <div className="text-2xl font-bold font-mono-data mt-1 text-red-400">
                  {returnedCount} / {gearAllocations.length} Returned
                </div>
                <span className="text-[10px] text-neutral-400">End-of-Sunday lockup</span>
              </div>
              <CheckCircle className="w-8 h-8 text-red-500 opacity-80" />
            </div>

            <div className="bg-black border border-neutral-800 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-xs text-neutral-400 font-medium">Quick Lockdown</span>
              <button
                type="button"
                onClick={handleReturnAll}
                className="mt-2 w-full py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark All Bags Returned</span>
              </button>
            </div>
          </div>

          {/* Sectors Table */}
          <div className="bg-black border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Sunday Sector Gear Checkouts</h3>
              <span className="text-xs text-neutral-400 font-mono-data">
                Checked out from Milltown Pavilion Shed
              </span>
            </div>

            <div className="divide-y divide-neutral-800">
              {gearAllocations.map((gear) => (
                <div
                  key={gear.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-950/60 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-950/80 text-red-200 font-mono-data border border-red-800/80">
                        {gear.sectorCode}
                      </span>
                      <span className="text-sm font-bold text-white">{gear.ballBagNumber}</span>
                      <span className="text-xs text-neutral-300">({gear.assignedAgeGroup})</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
                      <span>👕 Bibs: <strong className="text-white">{gear.bibColor}</strong></span>
                      <span className="text-neutral-600">·</span>
                      <span>🔶 Cones: <strong className="text-white">{gear.conesCount}</strong></span>
                      <span className="text-neutral-600">·</span>
                      <span>🥅 Mini Goals: <strong className="text-white">{gear.miniGoalsCount}</strong></span>
                      <span className="text-neutral-600">·</span>
                      <span>🪜 Ladders: <strong className="text-white">{gear.laddersCount}</strong></span>
                    </div>

                    <p className="text-xs text-neutral-300">
                      Checked out by: <span className="text-red-400 font-semibold">{gear.checkedOutBy}</span>
                      {gear.notes && <span className="ml-2 italic text-neutral-400">({gear.notes})</span>}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start md:self-auto">
                    <button
                      type="button"
                      onClick={() => handleToggleReturn(gear.id)}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all ${
                        gear.isReturned
                          ? 'bg-neutral-900 text-white border border-neutral-700 hover:border-neutral-500'
                          : 'bg-red-600 hover:bg-red-500 text-white border border-red-500'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{gear.isReturned ? 'Returned to Shed' : 'On Pitch (Tap to Return)'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: First Aid & Player Safety Log */}
      {activeTab === 'safety' && (
        <div className="space-y-6">
          {/* Safety Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-black border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-400 font-medium">Clubhouse Freezer Ice Packs</span>
                <div className="text-2xl font-bold font-mono-data mt-1 text-white">
                  {icePacksInFreezer} in Stock
                </div>
                <span className="text-[10px] text-neutral-400">Ready for pitch sprains</span>
              </div>
              <button
                type="button"
                onClick={() => setIcePacksInFreezer((p) => p + 6)}
                className="px-3 py-1.5 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 rounded-lg transition-colors"
              >
                + Restock 6
              </button>
            </div>

            <div className="bg-black border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-400 font-medium">Mouthguard Compliance</span>
                <div className="text-2xl font-bold font-mono-data mt-1 text-red-400">100% Mandatory</div>
                <span className="text-[10px] text-neutral-400">Checked prior to slot start</span>
              </div>
              <CheckCircle className="w-8 h-8 text-red-500 opacity-80" />
            </div>

            <div className="bg-black border border-neutral-800 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-xs text-neutral-400 font-medium">Pitch Incident Reporting</span>
              <button
                type="button"
                onClick={() => setShowLogIncidentModal(true)}
                className="mt-2 w-full py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log First Aid Incident</span>
              </button>
            </div>
          </div>

          {/* Incident Log Feed */}
          <div className="bg-black border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-red-500" />
                Safety & Pitch Incident Log ({firstAidIncidents.length})
              </h3>
              <span className="text-xs text-neutral-400 font-mono-data">
                Old Alex Youth Hockey Ireland Log
              </span>
            </div>

            <div className="divide-y divide-neutral-800 font-sans">
              {firstAidIncidents.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400">
                  Zero pitch incidents recorded. All clear!
                </div>
              ) : (
                firstAidIncidents.map((inc) => (
                  <div key={inc.id} className="p-5 space-y-2 hover:bg-neutral-950/60">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded font-mono-data text-[10px] font-bold bg-red-950 text-red-200 border border-red-800">
                          {inc.incidentType}
                        </span>
                        <h4 className="text-sm font-bold text-white">{inc.playerName}</h4>
                        <span className="text-xs text-neutral-300">
                          ({inc.ageGroupId} · {inc.pitchSectorId})
                        </span>
                      </div>
                      <span className="text-xs font-mono-data text-neutral-400">
                        {inc.date} at {inc.time}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-200 leading-relaxed bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                      <strong className="text-white">Treatment:</strong> {inc.treatment}
                    </p>

                    <div className="flex flex-wrap items-center justify-between text-xs text-neutral-400 pt-1">
                      <span className="flex items-center gap-1">
                        Parent Notified:
                        {inc.parentNotified ? (
                          <span className="text-red-400 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Yes (Pitch-side / Call)
                          </span>
                        ) : (
                          <span className="text-neutral-400 font-semibold">Pending follow-up</span>
                        )}
                      </span>
                      <span>Logged by Coach: <strong className="text-white">{inc.loggedByCoach}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Log Incident Modal */}
      {showLogIncidentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleLogIncident}
            className="bg-black border border-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-red-500" />
                Log Pitch First Aid Incident
              </h3>
              <button
                type="button"
                onClick={() => setShowLogIncidentModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Time of Incident</label>
                <input
                  type="time"
                  required
                  value={incTime}
                  onChange={(e) => setIncTime(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono-data"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Pitch Sector</label>
                <select
                  value={incSector}
                  onChange={(e) => setIncSector(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option value="P1N">P1 North (Main)</option>
                  <option value="P1S">P1 South (Main)</option>
                  <option value="P2N">P2 North</option>
                  <option value="P2S">P2 South</option>
                  <option value="Pitch 3">Pitch 3 / Cage</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Age Group</label>
                <select
                  value={incGroup}
                  onChange={(e) => setIncGroup(e.target.value as AgeGroup)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  {[
                    'PEN',
                    '1st Class',
                    '2nd Class',
                    '3rd Class',
                    '4th Class',
                    '5th Class',
                    '6th Class',
                    '1st Years',
                    'Minors',
                    'Inters',
                  ].map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Player Name</label>
                <input
                  type="text"
                  required
                  value={incPlayer}
                  onChange={(e) => setIncPlayer(e.target.value)}
                  placeholder="E.g. Aoife Kelly"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Incident Classification</label>
              <select
                value={incType}
                onChange={(e) => setIncType(e.target.value as FirstAidIncident['incidentType'])}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="Stick Strike">Stick Strike</option>
                <option value="Ball Contact">Ball Contact</option>
                <option value="Sprain / Twist">Sprain / Twist</option>
                <option value="Cut / Abrasion">Cut / Abrasion</option>
                <option value="Head Knock (HIA Precaution)">Head Knock (HIA Precaution)</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Treatment Applied</label>
              <textarea
                rows={2}
                required
                value={incTreatment}
                onChange={(e) => setIncTreatment(e.target.value)}
                placeholder="E.g. Ice pack applied for 10 minutes, wound cleaned..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Logged by Coach</label>
                <input
                  type="text"
                  required
                  value={incCoach}
                  onChange={(e) => setIncCoach(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-4">
                <label className="flex items-center gap-2 text-xs text-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incParentNotified}
                    onChange={(e) => setIncParentNotified(e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 bg-neutral-950 border-neutral-700 focus:ring-red-500"
                  />
                  <span>Parent notified pitch-side</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowLogIncidentModal(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg transition-colors"
              >
                Record Incident
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
