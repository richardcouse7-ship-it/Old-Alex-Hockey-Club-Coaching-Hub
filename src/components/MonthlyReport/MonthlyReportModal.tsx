import React from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Clock,
  Users,
  Award,
  BarChart3,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import { Coach, PitchSector, SessionSlot } from '../../types';
import { ExportService } from '../../services/exportService';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: SessionSlot[];
  coaches: Coach[];
  sectors: PitchSector[];
  monthName?: string;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  isOpen,
  onClose,
  slots,
  coaches,
  sectors,
  monthName = 'September 2026',
}) => {
  if (!isOpen) return null;

  // Compute Coach Hours (each slot is 1.25 hours = 75 mins)
  const hoursPerSlot = 1.25;
  const coachStats = coaches.map((coach) => {
    const slotsCount = slots.filter((s) => s.assignedCoachIds.includes(coach.id)).length;
    const totalHours = Math.round(slotsCount * hoursPerSlot * 10) / 10;
    return {
      coach,
      slotsCount,
      totalHours,
    };
  }).sort((a, b) => b.totalHours - a.totalHours);

  // Sector stats
  const sectorUsage = sectors.map((sec) => {
    const count = slots.filter((s) => s.pitchSectorId === sec.id).length;
    const hours = Math.round(count * hoursPerSlot * 10) / 10;
    return {
      sector: sec,
      count,
      hours,
    };
  });

  const totalSessions = slots.length;
  const totalCoachingHours = Math.round(totalSessions * hoursPerSlot * 10) / 10;
  const readySlots = slots.filter((s) => s.status === 'Ready').length;
  const complianceRate = totalSessions > 0 ? Math.round((readySlots / totalSessions) * 100) : 100;

  const handleDownloadCSV = () => {
    const csvContent = ExportService.exportMonthlyReportCSV(slots, coaches, sectors);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Old_Alex_Hockey_Monthly_Report_${monthName.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-black border border-neutral-800 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Modal Top Bar */}
        <div className="flex items-start justify-between border-b border-neutral-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-md">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-data text-red-500 font-bold uppercase tracking-wider">
                  Old Alex Hockey Club
                </span>
                <span className="text-neutral-600">·</span>
                <span className="text-xs text-neutral-400">Monthly Coaching Summary</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                Executive Operations Report — {monthName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="px-4 py-2 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-white rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
              title="Download raw data as CSV spreadsheet"
            >
              <Download className="w-4 h-4 text-red-500" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-1.5 transition-colors shadow-md"
              title="Print formatted report"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* High-level Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
            <span className="text-xs text-neutral-400 font-medium">Scheduled Sessions</span>
            <div className="text-2xl font-bold text-white font-mono-data mt-1">
              {totalSessions}
            </div>
            <span className="text-[10px] text-neutral-400">Across 10 Age Groups</span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
            <span className="text-xs text-neutral-400 font-medium">Total Coaching Hours</span>
            <div className="text-2xl font-bold text-red-400 font-mono-data mt-1">
              {totalCoachingHours}h
            </div>
            <span className="text-[10px] text-neutral-400">75 mins per slot block</span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
            <span className="text-xs text-neutral-400 font-medium">Active Coaching Staff</span>
            <div className="text-2xl font-bold text-white font-mono-data mt-1">
              {coachStats.filter((c) => c.slotsCount > 0).length}
            </div>
            <span className="text-[10px] text-neutral-400">Of {coaches.length} rostered</span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
            <span className="text-xs text-neutral-400 font-medium">Plan & Staffing Rate</span>
            <div className="text-2xl font-bold text-white font-mono-data mt-1">
              {complianceRate}%
            </div>
            <span className="text-[10px] text-neutral-400">Full readiness ratio</span>
          </div>
        </div>

        {/* Coach Hours Timesheet Table */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-red-500" />
              Coach Allocation & Hours Delivered
            </h3>
            <span className="text-xs text-neutral-400 font-mono-data">
              Sorted by highest commitment
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-900 text-neutral-300 uppercase font-mono-data border-b border-neutral-800">
                <tr>
                  <th className="py-2.5 px-3">Coach Name</th>
                  <th className="py-2.5 px-3">Pathway Role</th>
                  <th className="py-2.5 px-3 text-right">Slots Assigned</th>
                  <th className="py-2.5 px-3 text-right">Hours Logged</th>
                  <th className="py-2.5 px-3 text-right">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 font-mono-data">
                {coachStats.map(({ coach, slotsCount, totalHours }) => (
                  <tr key={coach.id} className="hover:bg-neutral-900/60 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-semibold text-white flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: coach.accentColor }}
                      />
                      {coach.name}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-neutral-300">{coach.role}</td>
                    <td className="py-2.5 px-3 text-right text-neutral-200">{slotsCount}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-red-400">
                      {totalHours} hrs
                    </td>
                    <td className="py-2.5 px-3 text-right text-neutral-400 text-[11px]">
                      {coach.phone}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pitch Sector Utilization Breakdown */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-500" />
            Milltown Turf Sector Utilization
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sectorUsage.map(({ sector, count, hours }) => (
              <div
                key={sector.id}
                className="p-3.5 rounded-xl bg-black border border-neutral-800 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-400 font-mono-data">{sector.code}</span>
                  <span className="font-mono-data text-neutral-300">{hours} Hours</span>
                </div>
                <p className="font-semibold text-white mt-1">{sector.name}</p>
                <p className="text-[11px] text-neutral-400">{count} sessions hosted</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-xs text-neutral-400">
          <span>Old Alex Hockey Club · Registered with Hockey Ireland</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl border border-neutral-750 transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
