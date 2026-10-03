import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Palette, Shield, X, Check, Trash2 } from 'lucide-react';
import { Coach } from '../../types';

interface AddEditCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachToEdit: Coach | null; // null means Add Mode
  onSaveCoach: (coach: Coach) => void;
  onDeleteCoach?: (coachId: string) => void;
}

const COLOR_PRESETS = [
  { name: 'Purple', hex: '#9333ea' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Sky Blue', hex: '#0284c7' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Teal', hex: '#0d9488' },
  { name: 'Indigo', hex: '#4f46e5' },
];

const STANDARD_ROLES = [
  'Director of Coaching / Head of Youth',
  'Foundation Phase Lead (PEN - 2nd Class)',
  'Development Phase Lead (3rd - 6th Class)',
  'Youth Performance Lead (1st Years - Inters)',
  'Goalkeeping Specialist',
  'Senior 1s Player / Coach',
  '3D Skills & Elimination Specialist',
  'Defense & Penalty Corner Coach',
  'Youth Coach',
  'Apprentice Coach',
];

export const AddEditCoachModal: React.FC<AddEditCoachModalProps> = ({
  isOpen,
  onClose,
  coachToEdit,
  onSaveCoach,
  onDeleteCoach,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState(STANDARD_ROLES[0]);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [accentColor, setAccentColor] = useState(COLOR_PRESETS[0].hex);
  const [initials, setInitials] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (coachToEdit) {
      setName(coachToEdit.name);
      setRole(coachToEdit.role);
      setPhone(coachToEdit.phone || '');
      setEmail(coachToEdit.email || '');
      setAccentColor(coachToEdit.accentColor || COLOR_PRESETS[0].hex);
      setInitials(coachToEdit.initials || computeInitials(coachToEdit.name));
      setIsActive(coachToEdit.isActive ?? true);
      setShowConfirmDelete(false);
    } else {
      setName('');
      setRole(STANDARD_ROLES[0]);
      setPhone('+353 8');
      setEmail('');
      setAccentColor(COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)].hex);
      setInitials('');
      setIsActive(true);
      setShowConfirmDelete(false);
    }
  }, [coachToEdit, isOpen]);

  const computeInitials = (fullName: string) => {
    return fullName
      .trim()
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 3) || 'OA';
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!coachToEdit) {
      setInitials(computeInitials(val));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const savedCoach: Coach = {
      id: coachToEdit ? coachToEdit.id : `coach-${Date.now()}`,
      name: name.trim(),
      role: role.trim(),
      phone: phone.trim() || '+353 87 000 0000',
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@oldalex.ie`,
      accentColor,
      initials: initials.trim() || computeInitials(name),
      isActive,
    };

    onSaveCoach(savedCoach);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-black border border-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-md"
              style={{ backgroundColor: accentColor }}
            >
              {initials || 'OA'}
            </div>
            <div>
              <span className="text-[10px] font-mono-data text-red-500 font-bold uppercase tracking-wider">
                Coach Management
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {coachToEdit ? `Edit Coach Profile: ${coachToEdit.name}` : 'Add New Coach Profile'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Coach Name & Initials */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-neutral-300 font-semibold block mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Jessica Walsh"
                  className="w-full bg-neutral-900 border border-neutral-750 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="text-neutral-300 font-semibold block mb-1">Badge Initials</label>
              <input
                type="text"
                maxLength={3}
                value={initials}
                onChange={(e) => setInitials(e.target.value.toUpperCase())}
                placeholder="JW"
                className="w-full bg-neutral-900 border border-neutral-750 rounded-xl px-3 py-2.5 text-center font-bold text-white uppercase focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="text-neutral-300 font-semibold block mb-1">
              Coaching Role / Specialism <span className="text-red-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl p-2.5 text-white focus:outline-none focus:border-red-500"
            >
              {STANDARD_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-neutral-300 font-semibold block mb-1">Mobile Phone (WhatsApp)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+353 87 123 4567"
                  className="w-full bg-neutral-900 border border-neutral-750 rounded-xl pl-9 pr-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 font-mono-data"
                />
              </div>
            </div>

            <div>
              <label className="text-neutral-300 font-semibold block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coach@oldalex.ie"
                  className="w-full bg-neutral-900 border border-neutral-750 rounded-xl pl-9 pr-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Accent Color Picker */}
          <div>
            <label className="text-neutral-300 font-semibold block mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-red-500" />
              <span>Timetable Tag & Badge Color</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => setAccentColor(color.hex)}
                  className={`w-7 h-7 rounded-xl transition-transform flex items-center justify-center ${
                    accentColor === color.hex
                      ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black shadow-md'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {accentColor === color.hex && <Check className="w-4 h-4 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {/* Active Status Switch */}
          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white block">Active Roster Member</span>
              <span className="text-[11px] text-neutral-400">
                Inactive coaches are hidden from Sunday quick-assignment dropdowns.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                isActive ? 'bg-red-600' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-between gap-3">
            {coachToEdit && onDeleteCoach ? (
              <div>
                {!showConfirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(true)}
                    className="px-3 py-2 text-red-400 hover:text-white hover:bg-red-950/60 rounded-xl transition-colors flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Coach</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1 bg-red-950/80 border border-red-800/80 p-1.5 rounded-xl">
                    <span className="text-[10px] text-red-200 font-bold px-1">Confirm delete?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteCoach(coachToEdit.id);
                        onClose();
                      }}
                      className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-bold"
                    >
                      Yes, Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(false)}
                      className="px-2 py-1 text-neutral-400 hover:text-white text-[10px]"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-700 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold shadow-lg shadow-red-600/30 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>{coachToEdit ? 'Save Changes' : 'Create Coach'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
