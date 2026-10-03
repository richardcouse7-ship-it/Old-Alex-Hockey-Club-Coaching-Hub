import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Printer,
  FileDown,
  X,
  Shield,
  Layers,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  BookOpen,
  Eye,
  EyeOff,
  Share2,
  Cloud,
} from 'lucide-react';
import { Coach, Drill, PitchSector, SessionSlot } from '../../types';
import { TacticalDiagram } from '../TacticalBoard/TacticalDiagram';
import { useAppStore } from '../../store';
import { ExportService } from '../../services/exportService';
import {
  GoogleIntegrationService,
  DRIVE_FOLDER_NAME,
} from '../../services/googleIntegrationService';

interface DirectorPackGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: SessionSlot[];
  coaches: Coach[];
  sectors: PitchSector[];
  drills: Drill[];
  selectedDate: string;
}

export const DirectorPackGeneratorModal: React.FC<DirectorPackGeneratorModalProps> = ({
  isOpen,
  onClose,
  slots,
  coaches,
  sectors,
  drills,
  selectedDate,
}) => {
  // Director security access (loads PIN and unlock state from store)
  const isUnlocked = useAppStore((s) => s.isDirectorUnlocked);
  const setIsUnlocked = useAppStore((s) => s.setDirectorUnlocked);
  const currentPin = useAppStore((s) => s.directorPin);
  const setDirectorPin = useAppStore((s) => s.setDirectorPin);

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [packMode, setPackMode] = useState<'booklet' | 'single' | 'both'>('both');
  const [selectedGroup, setSelectedGroup] = useState<string>('PEN');
  const [showPinChange, setShowPinChange] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);
  const [isSavingDrive, setIsSavingDrive] = useState(false);
  const [driveSaveMsg, setDriveSaveMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === currentPin || pinInput.trim() === '1893') {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length >= 4) {
      setDirectorPin(newPin.trim());
      setPinChangeSuccess(true);
      setTimeout(() => {
        setPinChangeSuccess(false);
        setShowPinChange(false);
      }, 2000);
    }
  };

  const handleSaveToDrive = async () => {
    const auth = GoogleIntegrationService.getAuthStatus();
    if (!auth.isSignedIn) {
      alert('Please connect your Google account in Google Sync / Export Hub first.');
      return;
    }
    setIsSavingDrive(true);
    try {
      const html = ExportService.generateSundayMasterPDFHtml(
        selectedDate,
        slots,
        coaches,
        sectors,
        drills
      );
      const filename = `OldAlex_Director_Pack_${selectedDate}.html`;
      const res = await GoogleIntegrationService.uploadFileToDrive({
        filename,
        mimeType: 'text/html',
        content: html,
      });
      setDriveSaveMsg(`Saved to Drive: ${res.name}`);
      setTimeout(() => setDriveSaveMsg(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save to Google Drive');
    } finally {
      setIsSavingDrive(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-IE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-black border border-neutral-800 rounded-3xl w-full max-w-5xl max-h-[94vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Top Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-400 font-bold">
              {isUnlocked ? <Unlock className="w-5 h-5 text-red-400" /> : <Lock className="w-5 h-5 text-red-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-data text-red-500 font-bold uppercase tracking-wider">
                  Head of Youth Only
                </span>
                <span className="text-neutral-600">·</span>
                <span className="text-xs text-neutral-400">Strictly Confidential Master Access</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Sunday Coaching Pack Generator
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isUnlocked && (
              <>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveToDrive}
                  disabled={isSavingDrive}
                  className="px-3.5 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 text-emerald-400 border border-neutral-750 hover:border-emerald-600 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  title="Upload standalone HTML document to Google Drive folder"
                >
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  <span>{isSavingDrive ? 'Saving...' : driveSaveMsg || 'Save to Drive'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsUnlocked(false)}
                  className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-900"
                  title="Lock Portal"
                >
                  <Lock className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Access Gate Screen if Locked */}
        {!isUnlocked ? (
          <div className="p-8 sm:p-12 text-center max-w-md mx-auto space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-800 flex items-center justify-center text-red-500 mx-auto">
              <Shield className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Director & Head of Youth Access</h3>
              <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">
                This master pack generation facility contains full curriculum session plans, tactical schematics, and internal coaching notes across all 10 age groups.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-3 pt-2">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="Enter Director PIN (default: 1893)"
                  className="w-full text-center tracking-widest text-lg font-mono-data bg-neutral-950 border border-neutral-750 rounded-xl py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                  autoFocus
                />
                {pinError && (
                  <p className="text-xs text-red-400 mt-1.5 font-medium">
                    Incorrect PIN. Use Old Alex founding year (1893).
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-md transition-all active:scale-95"
              >
                Unlock Coaching Pack Studio
              </button>

              <div className="pt-2 text-[11px] text-neutral-400">
                🔒 Protected access for Richard Couse & Old Alex Coaching Executive
              </div>
            </form>
          </div>
        ) : (
          /* Unlocked Master Pack Generator */
          <div className="p-6 space-y-6">
            {/* Mode Selector & Security Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-neutral-950 p-4 rounded-2xl border border-neutral-800 shadow-md">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-white">Format Option:</span>
                <div className="flex flex-wrap items-center gap-1 bg-black p-1 rounded-xl border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setPackMode('both')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      packMode === 'both'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    ★ Generate Both A & B (Unified Master + Pitch Cards)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPackMode('booklet')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      packMode === 'booklet'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Option A: Master Sunday Booklet
                  </button>
                  <button
                    type="button"
                    onClick={() => setPackMode('single')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      packMode === 'single'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Option B: 1-Page Pitch Card
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {packMode === 'single' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-neutral-400">Age Group:</span>
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="bg-neutral-900 border border-neutral-750 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-500"
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
                )}

                <button
                  type="button"
                  onClick={() => setShowPinChange(!showPinChange)}
                  className="px-2.5 py-1.5 text-[11px] font-semibold text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-750 rounded-lg transition-colors"
                  title="Update Director Security PIN"
                >
                  🔒 Change PIN
                </button>
              </div>
            </div>

            {/* PIN Change Drawer if open */}
            {showPinChange && (
              <form
                onSubmit={handleSaveNewPin}
                className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-wrap items-center gap-3 text-xs"
              >
                <span className="text-white font-medium">Set New Director PIN (min 4 chars):</span>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="e.g. 1893"
                  maxLength={8}
                  className="bg-black border border-neutral-700 rounded-lg px-3 py-1.5 text-white w-28 text-center font-mono-data focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold"
                >
                  Update PIN
                </button>
                {pinChangeSuccess && (
                  <span className="text-red-400 font-medium">✓ New PIN saved to secure device storage!</span>
                )}
              </form>
            )}

            {/* Watermark Banner */}
            <div className="bg-red-950/40 border border-red-800/60 p-3 rounded-2xl flex items-center justify-between text-xs text-white">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                <span>
                  <strong>CONFIDENTIAL — HEAD OF YOUTH ONLY:</strong> Strictly for internal Old Alex coaching governance.
                </span>
              </div>
              <span className="font-mono-data text-[10px] bg-red-950 px-2 py-0.5 rounded border border-red-800 text-red-200">
                EYES ONLY · RICHARD COUSE
              </span>
            </div>

            {/* Print Booklet Preview Container */}
            <div className="space-y-8 bg-neutral-950 p-6 sm:p-10 rounded-2xl border border-neutral-800 shadow-inner relative">
              {/* Cover Page (When in Booklet or Both mode) */}
              {(packMode === 'booklet' || packMode === 'both') && (
                <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-black p-8 text-center space-y-6 relative">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600 text-white font-extrabold text-2xl font-display shadow-xl">
                    OA
                  </div>
                  <div>
                    <span className="text-xs font-mono-data tracking-widest text-red-400 font-bold uppercase">
                      OLD ALEXANDRA HOCKEY CLUB · FOUNDED 1893
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2 font-display">
                      SUNDAY COACHING PACK
                    </h1>
                    <p className="text-base text-neutral-300 mt-2 max-w-xl mx-auto font-medium">
                      Coach-ready session plans for the complete Old Alex youth pathway.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-neutral-800 max-w-lg mx-auto grid grid-cols-2 gap-4 text-xs font-mono-data text-neutral-300">
                    <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-800">
                      <span className="text-neutral-400 block text-[10px]">DATE:</span>
                      <span className="font-bold text-white">{formattedDate}</span>
                    </div>
                    <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-800">
                      <span className="text-neutral-400 block text-[10px]">LOCATION:</span>
                      <span className="font-bold text-white">Milltown AstroTurf, Dublin 6</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-400 italic">
                    Strictly for accredited Old Alex coaches. Return all equipment bags to the pavilion gear shed.
                  </p>
                </div>
              )}

              {/* Group Pages */}
              {(packMode === 'booklet'
                ? slots
                : slots.filter((s) => s.ageGroupId === selectedGroup)
              ).map((slot, index) => {
                const sector = sectors.find((sec) => sec.id === slot.pitchSectorId);
                const assignedCoaches = coaches.filter((c) =>
                  slot.assignedCoachIds.includes(c.id)
                );
                const attachedDrills = drills.filter((d) =>
                  ((slot.drillIds || (slot as unknown as { attachedDrillIds?: string[] }).attachedDrillIds || [])).includes(d.id)
                );

                return (
                  <div
                    key={slot.id}
                    className="border border-neutral-800 rounded-2xl overflow-hidden bg-black text-white p-6 sm:p-8 space-y-6 shadow-md page-break"
                  >
                    {/* Top Page Header matching video pack */}
                    <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-red-500 font-mono-data">
                            OLD ALEX HOCKEY CLUB | YOUTH COACHING
                          </span>
                          <span className="text-neutral-600">·</span>
                          <span className="text-xs text-neutral-400 font-mono-data">
                            PAGE {index + 1}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                          <span className="text-red-500 font-mono-data">{slot.ageGroupId}</span>
                          <span className="text-neutral-600 font-normal">—</span>
                          <span>{slot.sessionTitle}</span>
                        </h3>
                      </div>

                      <div className="text-right font-mono-data text-xs space-y-1">
                        <div className="text-white font-bold bg-neutral-900 px-2.5 py-1 rounded border border-neutral-750">
                          {slot.timeSlot}
                        </div>
                        <div className="text-neutral-300 text-[11px]">
                          {sector?.code} · {sector?.name}
                        </div>
                      </div>
                    </div>

                    {/* Logistics Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-neutral-400">
                          Lead Coaches
                        </span>
                        <p className="font-semibold text-white mt-0.5">
                          {assignedCoaches.map((c) => c.name).join(', ') || '⚠️ TBC Staff'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-neutral-400">
                          Pathway Phase
                        </span>
                        <p className="font-semibold text-white mt-0.5">{slot.pathway}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-neutral-400">
                          Duration
                        </span>
                        <p className="font-semibold text-red-400 mt-0.5">75 Minutes Active</p>
                      </div>
                    </div>

                    {/* Session Purpose */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                        Session Purpose & Core Objective
                      </h4>
                      <p className="text-sm text-neutral-200 leading-relaxed font-medium">
                        {slot.sessionPurpose}
                      </p>
                    </div>

                    {/* Running Order */}
                    {slot.runningOrder && slot.runningOrder.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                          Running Order & Timed Progression
                        </h4>
                        <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950">
                          <table className="w-full text-xs">
                            <thead className="bg-neutral-900 text-neutral-300 font-mono-data border-b border-neutral-800">
                              <tr>
                                <th className="py-2 px-3 text-left">Activity / Progression</th>
                                <th className="py-2 px-3 text-right">Time Allocated</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800 font-mono-data">
                              {slot.runningOrder.map((step, sIdx) => (
                                <tr key={sIdx}>
                                  <td className="py-2 px-3 font-sans text-neutral-200">
                                    {step.activity}
                                  </td>
                                  <td className="py-2 px-3 text-right text-red-400 font-bold">
                                    {step.durationMins} mins
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Attached Tactical Drills with Pitch Diagrams */}
                    {attachedDrills.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                          Tactical Setup & Turf Diagrams
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {attachedDrills.map((drill) => (
                            <div
                              key={drill.id}
                              className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-bold text-white">{drill.title}</h5>
                                <span className="text-[11px] font-mono-data text-red-400 font-bold">
                                  {drill.durationMinutes} mins
                                </span>
                              </div>

                              {drill.diagramElements && (
                                <TacticalDiagram
                                  elements={drill.diagramElements}
                                  height={160}
                                  title={drill.title}
                                />
                              )}

                              <p className="text-xs text-neutral-200 leading-relaxed">
                                {drill.setup}
                              </p>

                              <div>
                                <span className="text-[10px] font-bold uppercase text-red-500 block mb-1">
                                  Key Points:
                                </span>
                                <ul className="text-xs space-y-1 text-neutral-200">
                                  {drill.coachingPoints.slice(0, 3).map((pt, pIdx) => (
                                    <li key={pIdx} className="flex items-start gap-1.5">
                                      <span className="text-red-500 font-bold">•</span>
                                      {pt}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Equipment Checklist */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                        Equipment Checklist
                      </h4>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {slot.equipmentChecklist.map((item, eIdx) => (
                          <span
                            key={eIdx}
                            className="px-2.5 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-200 flex items-center gap-1.5"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-red-500" />
                            {item.item}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Post Session Reflection Prompt */}
                    <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 italic">
                      <span>After the Session: "What worked well? What should change next Sunday?"</span>
                      <span className="font-mono-data not-italic text-red-400 font-bold">
                        Old Alex Hockey Club · Milltown
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
