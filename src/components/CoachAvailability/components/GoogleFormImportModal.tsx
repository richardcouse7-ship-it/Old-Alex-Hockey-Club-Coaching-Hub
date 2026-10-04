import React, { useState, useMemo } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Coach, CoachAvailability } from '../../../types';
import { importGoogleFormResponses } from '../../../utils/coachFormImporter';

export interface GoogleFormImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  coaches: Coach[];
  availability: CoachAvailability[];
  onImportSuccess: (imported: CoachAvailability[]) => void;
}

const SAMPLE_GOOGLE_FORM_PASTE = `Timestamp,Name,Availability,Notes
2026/09/11 08:30:15,Jessica Walsh,Available,Can lead Foundation and 5th Class
2026/09/11 09:12:44,Meghan Moran,Available,Available for 12 o'clock float
2026/09/11 11:45:10,Ben McInerney,Available,Pitch 1 & 2 morning lead
2026/09/11 12:00:22,Katie Mullan,Available,Leading Inters C & D and Minor B
2026/09/11 13:10:05,Josh Gill,Available,1st Years & Inters
2026/09/11 14:02:19,Grace MacAllister,Available,Lead 3D skills on 1st Class
2026/09/11 15:20:30,Bo Hartley,Available,Assisting 1st Class
2026/09/11 16:55:00,Niamh O'Neill,Available,Umpiring Minor A and 12 o'clock float
2026/09/11 18:04:12,Conor Ryan,Available,Minor A & B coaching and umpiring
2026/09/11 19:40:55,Hannah Fox,Available,6th Class, 5th Class & 4th Class coverage`;

const GOOGLE_FORM_QUESTIONS_TEMPLATE = `Recommended Google Form Setup for Old Alex Coaches:
1. Question 1 (Short Answer): "Coach Full Name"
2. Question 2 (Multiple Choice): "Sunday Availability"
   - Available for any pitch slot (10:45 – 15:45)
   - Morning Only (10:45 – 12:30)
   - Afternoon Only (13:15 – 15:45)
   - Senior Match Duty (EYHL / Leinster League)
   - Away / Unavailable
3. Question 3 (Multiple Choice / Dropdown): "Preferred Age Group" (PEN, 1st–6th Class, 1st Years, Minors, Inters)
4. Question 4 (Paragraph): "Notes / Transport / Constraints"`;

export const GoogleFormImportModal: React.FC<GoogleFormImportModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  coaches,
  availability,
  onImportSuccess,
}) => {
  const [rawFormInput, setRawFormInput] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Live parsed preview
  const parsedPreview = useMemo(() => {
    if (!rawFormInput.trim()) return [];
    try {
      const merged = importGoogleFormResponses(rawFormInput, selectedDate, [], coaches);
      return merged;
    } catch {
      return [];
    }
  }, [rawFormInput, selectedDate, coaches]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawFormInput.trim()) return;

    const merged = importGoogleFormResponses(rawFormInput, selectedDate, availability, coaches);
    onImportSuccess(merged);
    setRawFormInput('');
    onClose();
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(GOOGLE_FORM_QUESTIONS_TEMPLATE);
    setCopyFeedback('Copied Google Form template!');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-black border border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between border-b border-neutral-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white">Import from Google Form Responses</h3>
            <p className="text-xs text-neutral-300">
              Copy and paste the responses columns from your Google Sheet or Form CSV.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Instructions */}
        <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1.5 text-xs text-white">
          <strong className="text-white block font-semibold">How to sync your Google Form in 10 seconds:</strong>
          <p className="text-[11px] text-neutral-300 leading-relaxed">
            1. In your Google Form, click <em>Responses → View in Sheets</em>.
            <br />
            2. Highlight the rows (Timestamp, Coach Name, Availability, Notes) and press{' '}
            <kbd className="px-1 bg-black rounded font-mono border border-neutral-700">Ctrl+C</kbd> (or{' '}
            <kbd className="px-1 bg-black rounded font-mono border border-neutral-700">Cmd+C</kbd>).
            <br />
            3. Paste into the box below and click <strong>Process & Sync</strong>. Names are automatically linked to your registered coaches!
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="text-neutral-400 font-mono-data text-[11px]">
            Columns: Timestamp | Coach Name | Availability | Notes
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyTemplate}
              className="text-xs text-neutral-400 hover:text-white underline"
            >
              {copyFeedback || 'Copy Form Template'}
            </button>
            <span className="text-neutral-700">·</span>
            <button
              type="button"
              onClick={() => setRawFormInput(SAMPLE_GOOGLE_FORM_PASTE)}
              className="text-red-400 hover:underline font-semibold"
            >
              Load Sample Data
            </button>
          </div>
        </div>

        {/* Text Area */}
        <textarea
          rows={6}
          required
          value={rawFormInput}
          onChange={(e) => setRawFormInput(e.target.value)}
          placeholder="Paste rows directly from Google Sheet (e.g. Timestamp, Coach Name, Available / Senior Match / Away, Notes)..."
          className="w-full bg-neutral-900 border border-neutral-750 rounded-xl p-3 text-xs font-mono-data text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
        />

        {/* Live Preview of Matched Responses */}
        {parsedPreview.length > 0 && (
          <div className="border border-neutral-800 bg-neutral-950 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Detected {parsedPreview.length} Coach Response{parsedPreview.length > 1 ? 's' : ''}</span>
              </span>
              <span className="text-[11px] text-neutral-400 font-mono-data">Target Date: {selectedDate}</span>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-neutral-900">
              {parsedPreview.map((item, idx) => {
                const isMatched = coaches.some((c) => c.id === item.coachId);
                return (
                  <div key={item.id || idx} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isMatched ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                        title={isMatched ? 'Matched to Old Alex Roster' : 'Guest / Unmatched Name'}
                      />
                      <span className="font-semibold text-white truncate">{item.coachName}</span>
                      {!isMatched && (
                        <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                          <AlertCircle className="w-3 h-3" />
                          <span>Guest</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          item.status === 'AVAILABLE'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : item.status === 'SENIOR_MATCH'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : item.status === 'MORNING_ONLY'
                            ? 'bg-neutral-800 text-white'
                            : 'bg-neutral-900 text-neutral-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
          <span className="text-[11px] text-neutral-400">
            Matches against Old Alex coaching roster automatically
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!rawFormInput.trim()}
              className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-md transition-colors"
            >
              Process & Sync Availability
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
