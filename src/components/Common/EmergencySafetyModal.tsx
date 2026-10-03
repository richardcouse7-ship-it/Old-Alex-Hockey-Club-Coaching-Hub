import React, { useState } from 'react';
import {
  PhoneCall,
  ShieldAlert,
  HeartPulse,
  AlertTriangle,
  X,
  MapPin,
  ExternalLink,
  MessageSquare,
  Copy,
  Check,
  Building2,
  Users,
  Flame,
} from 'lucide-react';
import { Player } from '../../types';

interface EmergencySafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlayer?: Player | null;
  pitchSectorCode?: string;
}

export const EmergencySafetyModal: React.FC<EmergencySafetyModalProps> = ({
  isOpen,
  onClose,
  selectedPlayer,
  pitchSectorCode = 'Pitch 1 North',
}) => {
  const [activeTab, setActiveTab] = useState<'contacts' | 'defib' | 'parent-alert'>('contacts');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  // Parent WhatsApp injury draft state
  const [parentName, setParentName] = useState(selectedPlayer?.parentName || '');
  const [parentPhone, setParentPhone] = useState(selectedPlayer?.parentPhone || '');
  const [playerName, setPlayerName] = useState(selectedPlayer?.name || '');
  const [sectorLocation, setSectorLocation] = useState(pitchSectorCode);
  const [injurySummary, setInjurySummary] = useState('Minor ball contact / ankle twist. Rested with ice pack.');
  const [alertCopied, setAlertCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyPhone = (label: string, number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedNumber(label);
    setTimeout(() => setCopiedNumber(null), 2500);
  };

  const generateParentWhatsAppMessage = () => {
    return `🚨 *OLD ALEX HOCKEY CLUB — PITCHSIDE WELFARE UPDATE* 🚨
Hi ${parentName || 'Parent'},

This is the Old Alex pitchside coaching team at Milltown.
${playerName || 'Your child'} has sustained a minor bump/knock during session on *${sectorLocation}*.

🏥 *Details:* ${injurySummary}
A coach/first-aider is with them at the sector dugout. They are resting comfortably.

Please come over to the pitch dugout when convenient, or call us directly.
— Old Alex Coaching & Welfare Team`;
  };

  const handleSendWhatsAppToParent = () => {
    const text = encodeURIComponent(generateParentWhatsAppMessage());
    const cleanPhone = parentPhone.replace(/[^0-9]/g, '');
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const emergencyContacts = [
    {
      label: 'Emergency Services (Ambulance / Fire / Gardaí)',
      number: '999',
      tel: 'tel:999',
      desc: 'National immediate emergency response (or 112 from mobile).',
      badge: 'Immediate Priority',
      badgeColor: 'bg-red-950 text-red-400 border-red-800',
    },
    {
      label: "St. Vincent's University Hospital A&E",
      number: '(01) 221 4000',
      tel: 'tel:+35312214000',
      desc: 'Closest adult acute emergency hospital (Elm Park, Dublin 4 — 7 mins drive).',
      badge: 'Local Acute A&E',
      badgeColor: 'bg-neutral-900 text-sky-400 border-neutral-700',
    },
    {
      label: "CHI Crumlin Children's Emergency (Pediatric)",
      number: '(01) 409 6100',
      tel: 'tel:+35314096100',
      desc: 'Specialist pediatric emergency department for youth players under 16.',
      badge: 'Pediatric Trauma',
      badgeColor: 'bg-neutral-900 text-amber-400 border-neutral-700',
    },
    {
      label: 'Richard Couse (Director of Coaching / Head of Youth)',
      number: '+353 87 912 3456',
      tel: 'tel:+353879123456',
      desc: 'On turf / Milltown Pavilion coaching coordination.',
      badge: 'Head of Youth',
      badgeColor: 'bg-neutral-900 text-red-400 border-neutral-700',
    },
    {
      label: "Club Children's Officer / Safeguarding",
      number: '+353 87 234 5678',
      desc: 'Aoife Kelly — Hockey Ireland designated safeguarding contact.',
      tel: 'tel:+353872345678',
      badge: 'Safeguarding',
      badgeColor: 'bg-neutral-900 text-emerald-400 border-neutral-700',
    },
    {
      label: 'Milltown Turf Grounds & Clubhouse Caretaker',
      number: '+353 86 345 6789',
      desc: 'Declan — Pitch floodlights, defib cabinet access & gate keys.',
      tel: 'tel:+353863456789',
      badge: 'Facility Lead',
      badgeColor: 'bg-neutral-900 text-neutral-300 border-neutral-700',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-neutral-950 border-2 border-red-600/70 rounded-3xl w-full max-w-3xl shadow-2xl shadow-red-950/40 overflow-hidden flex flex-col">
        {/* Top Emergency Red Banner */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black/40 border border-white/20 flex items-center justify-center font-bold">
              <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono-data uppercase tracking-wider font-extrabold bg-black/30 px-2 py-0.5 rounded">
                Old Alex HC · Milltown Pitchside Safety
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                Emergency Fast-Dial & Medical Protocol
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-black/30 hover:bg-black/50 text-white transition-colors border border-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 bg-black border-b border-neutral-800 text-center text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('contacts')}
            className={`py-3 flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'contacts'
                ? 'border-red-500 text-white bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <PhoneCall className="w-4 h-4 text-red-500" />
            <span>Fast-Dial Directory</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('defib')}
            className={`py-3 flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'defib'
                ? 'border-red-500 text-white bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <HeartPulse className="w-4 h-4 text-emerald-400" />
            <span>Defib (AED) Protocol</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('parent-alert')}
            className={`py-3 flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'parent-alert'
                ? 'border-red-500 text-white bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>Parent Injury Alert</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {/* TAB 1: FAST-DIAL DIRECTORY */}
          {activeTab === 'contacts' && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-300">
                1-tap phone dialer for pitchside emergencies. Tap <strong>Call Now</strong> to launch your phone app immediately.
              </p>

              <div className="space-y-2.5">
                {emergencyContacts.map((contact, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 sm:p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono-data font-bold border ${contact.badgeColor}`}>
                          {contact.badge}
                        </span>
                        <h4 className="text-sm font-bold text-white leading-snug">
                          {contact.label}
                        </h4>
                      </div>
                      <p className="text-xs text-neutral-400">{contact.desc}</p>
                      <p className="text-xs font-mono-data font-bold text-red-400">
                        {contact.number}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyPhone(contact.label, contact.number)}
                        className="p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
                        title="Copy number"
                      >
                        {copiedNumber === contact.label ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      <a
                        href={contact.tel}
                        className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition-transform active:scale-95"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>Call Now</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: DEFIBRILLATOR (AED) PROTOCOL */}
          {activeTab === 'defib' && (
            <div className="space-y-4">
              {/* AED Location Card */}
              <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-600/30 shrink-0">
                    <HeartPulse className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono-data font-bold uppercase text-emerald-400 tracking-wider">
                      Automated External Defibrillator (AED)
                    </span>
                    <h3 className="text-base font-extrabold text-white">
                      Milltown Clubhouse Exterior Wall
                    </h3>
                  </div>
                </div>

                <div className="text-xs text-emerald-100/90 space-y-1.5 bg-black/40 p-3.5 rounded-xl border border-emerald-800/40">
                  <p>
                    📍 <strong>Exact Location:</strong> Mounted on the external pavilion brick wall immediately beside the <strong>Pitch 1 North player entrance gate</strong>.
                  </p>
                  <p>
                    🔑 <strong>Cabinet Access:</strong> Green emergency cabinet. Turn lock clockwise or press emergency release latch. No security code required for life-saving access.
                  </p>
                </div>
              </div>

              {/* 4-Step Action Checklist */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono-data uppercase tracking-wider font-bold text-neutral-300">
                  Cardiac Emergency Protocol (First 4 Minutes)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
                    <span className="text-xs font-mono-data font-bold text-red-500">1. Dispatch Runner</span>
                    <p className="text-xs text-neutral-300">
                      Send a coach/parent immediately to the Clubhouse wall to retrieve the AED box.
                    </p>
                  </div>

                  <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
                    <span className="text-xs font-mono-data font-bold text-red-500">2. Call 999 / 112</span>
                    <p className="text-xs text-neutral-300">
                      State: <em>&quot;Old Alexandra Hockey Club, Milltown, Dublin 6. Suspected cardiac arrest on hockey pitch.&quot;</em>
                    </p>
                  </div>

                  <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
                    <span className="text-xs font-mono-data font-bold text-red-500">3. Continuous CPR</span>
                    <p className="text-xs text-neutral-300">
                      30 chest compressions at 100-120 bpm (staying alive tempo) to 2 rescue breaths.
                    </p>
                  </div>

                  <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
                    <span className="text-xs font-mono-data font-bold text-red-500">4. Open &amp; Power On AED</span>
                    <p className="text-xs text-neutral-300">
                      The device speaks verbal instructions. Peel and apply pads exactly as diagrammed on chest.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PARENT INJURY ALERT DISPATCH */}
          {activeTab === 'parent-alert' && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-300">
                Quickly alert a parent via WhatsApp about a pitchside injury or checkup.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="e.g. Aoife Kelly"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Parent Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="e.g. +353 87 234 5671"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono-data"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Parent Name
                  </label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="e.g. Fiona Kelly"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Pitch Location
                  </label>
                  <input
                    type="text"
                    value={sectorLocation}
                    onChange={(e) => setSectorLocation(e.target.value)}
                    placeholder="e.g. Pitch 1 North"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Injury / Treatment Summary
                </label>
                <textarea
                  rows={2}
                  value={injurySummary}
                  onChange={(e) => setInjurySummary(e.target.value)}
                  placeholder="Describe treatment applied..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Message Preview */}
              <div className="p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-1.5">
                <span className="text-[10px] font-mono-data uppercase tracking-wider text-neutral-400 font-bold">
                  Formatted WhatsApp Message Preview:
                </span>
                <p className="text-xs text-neutral-200 whitespace-pre-wrap bg-black/60 p-3 rounded-xl border border-neutral-850 font-mono leading-relaxed">
                  {generateParentWhatsAppMessage()}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generateParentWhatsAppMessage());
                    setAlertCopied(true);
                    setTimeout(() => setAlertCopied(false), 2500);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs border border-neutral-750 flex items-center gap-1.5 transition-colors"
                >
                  {alertCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{alertCopied ? 'Copied!' : 'Copy Text'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendWhatsAppToParent}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-transform active:scale-95"
                >
                  <MessageSquare className="w-4 h-4 fill-current" />
                  <span>Send WhatsApp to Parent</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
