import React, { useState } from 'react';
import { FileDown, Sparkles, Eye, FileText, X } from 'lucide-react';
import { Coach, Drill, PitchSector, SessionSlot } from '../../../types';
import { ExportService } from '../../../services/exportService';

export interface PrintExportTabProps {
  slots: SessionSlot[];
  coaches: Coach[];
  sectors: PitchSector[];
  drills: Drill[];
  selectedDate: string;
  onOpenDirectorPack?: () => void;
  onCloseParentModal: () => void;
  showToast: (msg: string) => void;
}

export const PrintExportTab: React.FC<PrintExportTabProps> = ({
  slots,
  coaches,
  sectors,
  drills,
  selectedDate,
  onOpenDirectorPack,
  onCloseParentModal,
  showToast,
}) => {
  const [selectedPdfSlotId, setSelectedPdfSlotId] = useState<string>(slots[0]?.id || '');
  const [pdfPreviewHtml, setPdfPreviewHtml] = useState<string | null>(null);
  const [customWeeklyNote] = useState<string>('');

  return (
    <div className="space-y-4">
      <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <FileDown className="w-4 h-4 text-purple-400" />
            <span>Digital PDFs & Pitchside Cards (Zero Paper Required)</span>
          </h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            High-contrast, sunlight-ready digital PDFs styled with Old Alex purple & amber. Optimized for crisp readability on iPhones, iPads, and Android devices pitchside in Milltown, or for archiving in cloud drives.
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
          100% Digital
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Complete Sunday Master PDF */}
        <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono-data">
                Sunday Master Blueprint PDF
              </span>
              <span className="text-[10px] bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded font-mono">
                All 10 Groups
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Complete single-document briefing with session timings, Pitch 1 & 2 allocations, P3 cage, assigned coaches, and club safety/AED contacts.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const html = ExportService.generateSundayMasterPDFHtml(
                    selectedDate,
                    slots.filter((s) => s.date === selectedDate),
                    coaches,
                    sectors,
                    drills,
                    customWeeklyNote
                  );
                  setPdfPreviewHtml(html);
                }}
                className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-200 hover:text-white flex items-center justify-center gap-1.5 transition-all"
              >
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span>Digital Preview</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const html = ExportService.generateSundayMasterPDFHtml(
                    selectedDate,
                    slots.filter((s) => s.date === selectedDate),
                    coaches,
                    sectors,
                    drills,
                    customWeeklyNote
                  );
                  ExportService.printOrSavePDF(html, `OldAlex-Sunday-Master-${selectedDate}`);
                  showToast('Master Sunday PDF generated! Save or share.');
                }}
                className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 transition-all active:scale-95"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Save as PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. 1-Page Sector & Age Group Card */}
        <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono-data">
                1-Page Sector / Age Group Card
              </span>
              <span className="text-[10px] bg-red-950/80 text-red-300 px-2 py-0.5 rounded font-mono">
                Mobile Pitch Card
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed mb-3">
              Targeted single-page PDF containing precise drill sequence, coaching focus points, equipment checklist, and co-coaches.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] text-neutral-400 font-medium block">
                Select Age Group Slot:
              </label>
              <select
                value={selectedPdfSlotId}
                onChange={(e) => setSelectedPdfSlotId(e.target.value)}
                className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {slots.map((s) => {
                  const sec = sectors.find((p) => p.id === s.pitchSectorId);
                  return (
                    <option key={s.id} value={s.id}>
                      {s.ageGroupId} ({s.timeSlot} · {sec?.code || s.pitchSectorId.toUpperCase()})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const targetSlot = slots.find((s) => s.id === selectedPdfSlotId) || slots[0];
                  const targetSector = sectors.find((sec) => sec.id === targetSlot?.pitchSectorId) || sectors[0];
                  if (!targetSlot || !targetSector) return;
                  const html = ExportService.generateSlot1PagePDFHtml(
                    targetSlot,
                    coaches,
                    targetSector,
                    drills,
                    selectedDate,
                    customWeeklyNote
                  );
                  setPdfPreviewHtml(html);
                }}
                className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-200 hover:text-white flex items-center justify-center gap-1.5 transition-all"
              >
                <Eye className="w-3.5 h-3.5 text-red-400" />
                <span>Digital Preview</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetSlot = slots.find((s) => s.id === selectedPdfSlotId) || slots[0];
                  const targetSector = sectors.find((sec) => sec.id === targetSlot?.pitchSectorId) || sectors[0];
                  if (!targetSlot || !targetSector) return;
                  const html = ExportService.generateSlot1PagePDFHtml(
                    targetSlot,
                    coaches,
                    targetSector,
                    drills,
                    selectedDate,
                    customWeeklyNote
                  );
                  ExportService.printOrSavePDF(html, `OldAlex-${targetSlot.ageGroupId}-${targetSlot.pitchSectorId}`);
                  showToast(`Generated ${targetSlot.ageGroupId} PDF Card!`);
                }}
                className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30 transition-all active:scale-95"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Save Slot PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Classic Director Pack button */}
      {onOpenDirectorPack && (
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-750 flex items-center justify-center text-neutral-400">
              <FileText className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Classic Multi-Page Director Pack</h4>
              <p className="text-[11px] text-neutral-400">
                Open the legacy full binder layout generator with page breaks and cover graphics.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onCloseParentModal();
              onOpenDirectorPack();
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-300 hover:text-white transition-all shrink-0"
          >
            Open Pack Generator
          </button>
        </div>
      )}

      {/* Fullscreen Digital PDF Preview Modal */}
      {pdfPreviewHtml && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-750 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3.5 px-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileDown className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold text-white">Digital PDF Pitchside Preview</span>
                <span className="text-xs text-neutral-400 hidden sm:inline">· Sunlight-Optimized A4</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    ExportService.printOrSavePDF(pdfPreviewHtml, `OldAlex-Digital-PDF-${selectedDate}`);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Save as PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPdfPreviewHtml(null)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-neutral-950 p-2 sm:p-4 overflow-auto flex justify-center">
              <iframe
                title="Digital PDF Preview"
                srcDoc={pdfPreviewHtml}
                className="w-full max-w-4xl h-full min-h-[500px] bg-white rounded-xl shadow-2xl border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
