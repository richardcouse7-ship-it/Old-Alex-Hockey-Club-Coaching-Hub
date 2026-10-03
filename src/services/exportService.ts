import {
  Coach,
  CoachAvailability,
  Drill,
  FirstAidIncident,
  MatchFixture,
  PitchSector,
  SectorGearAllocation,
  SessionSlot,
  Player,
  ClubWhatsAppGroup,
  BlitzTournament,
  HubBackupData,
} from '../types';

export type { HubBackupData };

export const ExportService = {
  // ==========================================
  // 1. WHATSAPP GENERATORS & DISPATCH
  // ==========================================

  /**
   * Generates a personalized Sunday itinerary for a single coach
   */
  generateIndividualCoachWhatsApp(
    coachId: string,
    dateStr: string,
    slots: SessionSlot[],
    sectors: PitchSector[],
    coaches: Coach[]
  ): string {
    const coach = coaches.find((c) => c.id === coachId);
    const coachName = coach ? coach.name : 'Coach';

    const formattedDate = new Date(dateStr).toLocaleDateString('en-IE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    const assignedSlots = slots.filter((s) => s.assignedCoachIds.includes(coachId));

    if (assignedSlots.length === 0) {
      return `🏑 *OLD ALEX HC — SUNDAY SCHEDULE* 🏑
📅 *${formattedDate}*
Hi ${coachName}! You currently have no pitch sessions assigned for this Sunday.
If your availability has changed, please let Richard know.
Enjoy your weekend! 💜💛`;
    }

    let msg = `🏑 *OLD ALEX HC — YOUR SUNDAY COACHING SCHEDULE* 🏑\n`;
    msg += `👤 *Coach:* ${coachName}\n`;
    msg += `📅 *Date:* ${formattedDate} (Milltown)\n`;
    msg += `📊 *Total Sessions:* ${assignedSlots.length} slot(s)\n\n`;

    assignedSlots.forEach((slot, idx) => {
      const sector = sectors.find((sec) => sec.id === slot.pitchSectorId);
      const otherCoaches = slot.assignedCoachIds
        .filter((id) => id !== coachId)
        .map((id) => coaches.find((c) => c.id === id)?.name || id)
        .join(', ');

      msg += `*SESSION ${idx + 1}: ${slot.ageGroupId} (${slot.pathway})*\n`;
      msg += `⏰ *Time:* ${slot.timeSlot}\n`;
      msg += `📍 *Sector:* ${sector?.name || slot.pitchSectorId} (${sector?.code || ''})\n`;
      msg += `🧢 *Co-Coach(es):* ${otherCoaches || 'Solo lead'}\n`;
      msg += `📋 *Session Focus:* ${slot.sessionTitle}\n`;
      if (slot.keyFocus) {
        msg += `🎯 *Key Emphasis:* ${slot.keyFocus}\n`;
      }
      msg += `\n`;
    });

    msg += `🎒 *Arrival Note:* Please arrive at Milltown 15 mins early to pick up balls/cones from the Kit Shed.\n`;
    msg += `⚠️ *Safety Check:* Ensure all players have mouthguards & shinguards before pushback.\n\n`;
    msg += `Thank you for coaching with Old Alex! 💜💛\n`;
    msg += `— Richard Couse (Director of Coaching)`;

    return msg;
  },

  /**
   * Generates Kit Shed and Safety broadcast for Sunday morning duty
   */
  generateKitShedSafetyWhatsApp(
    dateStr: string,
    gear: SectorGearAllocation[],
    firstAid: FirstAidIncident[],
    slots: SessionSlot[]
  ): string {
    const formattedDate = new Date(dateStr).toLocaleDateString('en-IE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    let msg = `🎒 *OLD ALEX HC — KIT SHED & SAFETY BULLETIN* 🏑\n`;
    msg += `📅 *Date:* ${formattedDate} | Milltown Pavilion\n\n`;
    msg += `📦 *PITCH GEAR ALLOCATIONS:*\n`;

    gear.forEach((item) => {
      msg += `• *${item.sectorCode}* (${item.assignedAgeGroup}): Bag #${item.ballBagNumber} | Bibs: ${item.bibColor} | Cones: ${item.conesCount}\n`;
    });

    msg += `\n⛑️ *FIRST AID & SAFETY PROTOCOLS:*\n`;
    msg += `• Pitch First Aid Kit is located in the Main Pavilion foyer.\n`;
    msg += `• Ice packs stored in Pavilion kitchen freezer.\n`;
    msg += `• Mandatory mouthguard check before whistle.\n`;
    msg += `• Report any injuries pitchside to Richard Couse or Pavilion desk.\n\n`;
    msg += `🔑 *Kit Shed Lockup:* Last coaches on Pitch 1 & 2 return all balls and lock shed.\n`;
    msg += `Go Alex! 💜💛`;

    return msg;
  },

  /**
   * Dual-Track: Age Group Parent Circular (WhatsApp)
   */
  generateParentCircularWhatsApp(
    slot: SessionSlot,
    sector: PitchSector,
    dateStr: string,
    customNote?: string
  ): string {
    const formattedDate = new Date(dateStr).toLocaleDateString('en-IE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    const times = slot.timeSlot.includes('–')
      ? slot.timeSlot.split('–').map((t) => t.trim())
      : slot.timeSlot.split('-').map((t) => t.trim());
    const startTime = times[0] || slot.startTime || '10:00';
    const endTime = times[1] || slot.endTime || '11:15';

    let msg = `🏑 *OLD ALEX HC — ${slot.ageGroupId.toUpperCase()} PARENT NOTICE* 🏑\n`;
    msg += `📅 *Date:* ${formattedDate} (Milltown Astro)\n`;
    msg += `⏰ *Session Time:* ${slot.timeSlot}\n`;
    msg += `📍 *Pitch Sector:* ${sector.name} (${sector.code})\n\n`;

    msg += `📋 *SESSION FOCUS:*\n`;
    msg += `• *Topic:* ${slot.sessionTitle}\n`;
    if (slot.keyFocus) {
      msg += `• *Key Emphasis:* ${slot.keyFocus}\n`;
    }
    msg += `\n`;

    msg += `⚠️ *SAFETY & GEAR CHECKLIST (MANDATORY):*\n`;
    msg += `1️⃣ *Mouthguard:* STRICTLY MANDATORY. No mouthguard = cannot train.\n`;
    msg += `2️⃣ *Shinguards:* Required under hockey socks.\n`;
    msg += `3️⃣ *Footwear:* Astro turf runners (no metal studs).\n`;
    msg += `4️⃣ *Hydration:* Named water bottle.\n\n`;

    msg += `🚗 *DROP-OFF & COLLECTION:*\n`;
    msg += `• Drop-off: Please arrive at Pavilion Gate at ${startTime} (10 mins prior).\n`;
    msg += `• Collection: Promptly at ${endTime} at the pitch dugout.\n`;
    msg += `• Parking: Please park in marked clubhouse bays only.\n\n`;

    if (customNote && customNote.trim()) {
      msg += `📝 *SPECIAL NOTE:*\n${customNote.trim()}\n\n`;
    }

    msg += `Looking forward to a fantastic session! Go Alex! 💜💛\n`;
    msg += `— Richard Couse (Director of Coaching / Head of Youth)`;
    return msg;
  },

  generateParentUpdateWhatsApp(
    slot: SessionSlot,
    sector: PitchSector,
    dateStr: string,
    customNote?: string
  ): string {
    return this.generateParentCircularWhatsApp(slot, sector, dateStr, customNote);
  },

  /**
   * Dual-Track: Coach Technical Briefing (WhatsApp)
   */
  generateCoachBriefingWhatsApp(
    slot: SessionSlot,
    coaches: Coach[],
    sector: PitchSector,
    drills: Drill[],
    customNote?: string
  ): string {
    const assignedCoaches = coaches
      .filter((c) => slot.assignedCoachIds.includes(c.id))
      .map((c) => c.name)
      .join(', ') || 'Unassigned (Needs Coach)';

    const slotDrillIds = slot.drillIds || slot.attachedDrillIds || [];
    const attachedDrills = drills.filter((d) => slotDrillIds.includes(d.id));

    let msg = `🏑 *OLD ALEX HC — COACH TECHNICAL BRIEFING* 🏑\n`;
    msg += `👥 *Squad:* ${slot.ageGroupId} (${slot.pathway} Pathway)\n`;
    msg += `⏰ *Time:* ${slot.timeSlot}\n`;
    msg += `📍 *Pitch Sector:* ${sector.name} (${sector.code})\n`;
    msg += `🧢 *Assigned Coaches:* ${assignedCoaches}\n`;
    msg += `🎯 *Session Title:* ${slot.sessionTitle}\n`;
    if (slot.sessionPurpose) {
      msg += `💡 *Purpose:* ${slot.sessionPurpose}\n`;
    }
    msg += `\n`;

    if (slot.runningOrder && slot.runningOrder.length > 0) {
      msg += `⏱️ *RUNNING ORDER:*\n`;
      slot.runningOrder.forEach((item, i) => {
        msg += ` ${i + 1}. ${item.activity} (${item.durationMins}m)${item.notes ? ` — ${item.notes}` : ''}\n`;
      });
      msg += `\n`;
    }

    if (attachedDrills.length > 0) {
      msg += `📚 *ATTACHED CURRICULUM DRILLS:*\n`;
      attachedDrills.forEach((d, i) => {
        msg += `*${i + 1}. ${d.title}* (${d.durationMinutes}m | ${d.skill})\n`;
        msg += `   • *Setup:* ${d.setup}\n`;
        msg += `   • *Key Points:* ${d.coachingPoints.slice(0, 2).join('; ')}\n`;
      });
      msg += `\n`;
    }

    if (slot.coachNotes) {
      msg += `📝 *Director Tactical Notes:* ${slot.coachNotes}\n\n`;
    }

    if (customNote && customNote.trim()) {
      msg += `📢 *NOTICE:* ${customNote.trim()}\n\n`;
    }

    msg += `🎒 *Kit Duty:* Collect Bag for ${sector.code} from Milltown Kit Shed 15 mins early.\n`;
    msg += `— Richard Couse (Director of Coaching)`;
    return msg;
  },

  /**
   * Urgent Weather / Delayed Pushback Broadcast (WhatsApp)
   */
  generateWeatherDelayWhatsApp(
    dateStr: string,
    slots: SessionSlot[],
    delayMins: number,
    reasonNote = 'Pitch inspection / frost clearance'
  ): string {
    const formattedDate = new Date(dateStr).toLocaleDateString('en-IE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    let msg = `⚠️ *OLD ALEX HC — URGENT SUNDAY TIMETABLE UPDATE* ⚠️\n`;
    msg += `📅 *Date:* ${formattedDate} (Milltown Astro)\n`;
    msg += `📢 *Status Update:* ${reasonNote}\n\n`;
    msg += `All sessions today are shifted by *+${delayMins} minutes* to ensure player safety.\n\n`;
    msg += `⏰ *REVISED SUNDAY SCHEDULE:*\n`;

    slots.forEach((s) => {
      msg += `• *${s.ageGroupId}* (${s.pitchSectorId.toUpperCase()}): *${s.timeSlot}*\n`;
    });

    msg += `\n🧤 *Weather Prep:* Please ensure all players wear thermal base layers, gloves, and beanies.\n`;
    msg += `Thank you for your patience and support! Go Alex! 💜💛\n`;
    msg += `— Richard Couse (Director of Coaching / Head of Youth)`;
    return msg;
  },

  /**
   * Generates clean Sunday timetable WhatsApp copy
   */
  generateWhatsAppCopy(
    dateStr: string,
    slots: SessionSlot[],
    coaches: Coach[],
    sectors: PitchSector[]
  ): string {
    const formattedDate = new Date(dateStr).toLocaleDateString('en-IE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const timeSlots = Array.from(new Set(slots.map((s) => s.timeSlot))).sort();

    let output = `🏑 *OLD ALEX HOCKEY CLUB — SUNDAY COACHING TIMETABLE*\n`;
    output += `📅 *${formattedDate}* | Milltown Pitches\n\n`;

    for (const timeSlot of timeSlots) {
      output += `⏰ *${timeSlot}*\n`;
      const slotItems = slots.filter((s) => s.timeSlot === timeSlot);

      for (const slot of slotItems) {
        const sector = sectors.find((p) => p.id === slot.pitchSectorId);
        const assignedCoaches = slot.assignedCoachIds
          .map((id) => coaches.find((c) => c.id === id)?.name || id)
          .join(', ');

        output += `• *${sector?.code || slot.pitchSectorId}* | ${slot.ageGroupId} (${slot.pathway})\n`;
        output += `   👤 Coaches: ${assignedCoaches || '⚠️ TBC'}\n`;
        output += `   🎯 Focus: ${slot.sessionTitle}\n`;
      }
      output += `\n`;
    }

    output += `📍 Old Alex Hockey Club · Alexandra College, Milltown, Dublin 6\n`;
    output += `ℹ️ Generated via Old Alex Coaching Hub · Director of Coaching: Richard Couse`;

    return output;
  },

  /**
   * Matchday Squad Notice WhatsApp
   */
  generateMatchdaySquadWhatsApp(fixture: MatchFixture): string {
    return `🏑 *OLD ALEX HC — MATCHDAY SQUAD NOTICE* 🏑\n` +
      `🏆 *Competition:* ${fixture.competition}\n` +
      `👥 *Squad:* ${fixture.ageGroupOrTeam}\n` +
      `⚔️ *Opposition:* vs ${fixture.opposition}\n` +
      `📅 *Date:* ${fixture.date}\n` +
      `⏰ *Pushback Time:* ${fixture.pushbackTime} (Meet 45 mins prior)\n` +
      `📍 *Venue:* ${fixture.venue} ${fixture.isHome ? '(Home - Milltown)' : '(Away)'}\n\n` +
      `🎽 *Kit:* ${fixture.isHome ? 'Home Kit (Old Alex Purple & Gold)' : 'Check opposition colors (Bring both Purple & White)'}\n` +
      `🧢 *Lead Coach/Manager:* ${fixture.leadCoachOrManager}\n` +
      `🚩 *Umpires:* ${fixture.umpires.join(', ')}\n\n` +
      (fixture.notes ? `📝 *Notes:* ${fixture.notes}\n` : '') +
      `Please confirm player availability via your squad manager ASAP. Go Alex! 💜\n`;
  },

  /**
   * Coaches Availability Callout WhatsApp
   */
  generateAvailabilityCalloutWhatsApp(date: string, totalCount?: number): string {
    return `📢 *ATTENTION ALL OLD ALEX COACHES* 📢\n` +
      `📅 *Sunday Availability Check — ${date}*\n\n` +
      `Hi team! Please submit your coaching availability for this coming Sunday at Milltown.\n` +
      `We have 10 youth age groups across Pitches 1, 2 & 3 needing lead coaches & apprentices!\n\n` +
      `👉 *Submit in 10 seconds via our Coach Portal:*\n` +
      `Select your name and tap your status (Available / Morning / Senior EYHL Match / Away).\n` +
      `If you already use the Google Form, your responses sync automatically to the Coaching Hub!\n\n` +
      `Thank you for your commitment to Old Alex Youth Hockey! 💜💛\n` +
      `— Richard Couse (Director of Coaching / Head of Youth)\n`;
  },

  /**
   * Opens WhatsApp Web or mobile app directly with prefilled message
   */
  openWhatsAppDirect(text: string, phone?: string): void {
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const encoded = encodeURIComponent(text);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  /**
   * Opens a specific WhatsApp group invite link or phone chat, automatically copying the briefing text to clipboard
   */
  async openWhatsAppGroup(targetLinkOrPhone?: string, text?: string): Promise<boolean> {
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Fallback
      }
    }

    if (!targetLinkOrPhone || !targetLinkOrPhone.trim()) {
      this.openWhatsAppDirect(text || '');
      return true;
    }

    const target = targetLinkOrPhone.trim();

    // Check if it is a WhatsApp Group Invite URL (chat.whatsapp.com/...)
    if (target.includes('chat.whatsapp.com') || target.startsWith('http')) {
      window.open(target, '_blank', 'noopener,noreferrer');
      return true;
    }

    // Otherwise treat as a phone number
    this.openWhatsAppDirect(text || '', target);
    return true;
  },

  // ==========================================
  // 2. EMAIL GENERATORS & DISPATCH
  // ==========================================

  /**
   * Generates master Sunday schedule email (text & rich HTML)
   */
  generateSundayMasterEmail(
    dateStr: string,
    slots: SessionSlot[],
    coaches: Coach[],
    sectors: PitchSector[],
    drills: Drill[]
  ): { subject: string; text: string; html: string } {
    const formattedDate = new Date(dateStr).toLocaleDateString('en-IE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const subject = `Old Alex HC — Sunday Master Coaching Schedule (${formattedDate})`;

    // Plain text version
    let text = `OLD ALEX HOCKEY CLUB — SUNDAY MASTER COACHING SCHEDULE\n`;
    text += `Date: ${formattedDate}\n`;
    text += `Venue: Milltown Pitches (P1 North/South, P2 North/South, Pitch 3 Skills Cage)\n\n`;
    text += `Dear Old Alex Coaches & Managers,\n\n`;
    text += `Here is the confirmed master timetable and pitch allocations for this Sunday at Milltown:\n\n`;

    const timeSlots = Array.from(new Set(slots.map((s) => s.timeSlot))).sort();

    timeSlots.forEach((time) => {
      text += `--- ${time} ---\n`;
      const timeSlotsItems = slots.filter((s) => s.timeSlot === time);
      timeSlotsItems.forEach((s) => {
        const sector = sectors.find((sec) => sec.id === s.pitchSectorId);
        const assignedCoaches = s.assignedCoachIds
          .map((id) => coaches.find((c) => c.id === id)?.name || id)
          .join(', ') || 'Unassigned';

        text += `• ${sector?.code || s.pitchSectorId}: ${s.ageGroupId} (${s.pathway}) | Coaches: ${assignedCoaches}\n`;
        text += `  Session: ${s.sessionTitle}\n`;
      });
      text += `\n`;
    });

    text += `SAFETY & GEAR REMINDERS:\n`;
    text += `1. Arrive 15 minutes before your slot to retrieve equipment from the Kit Shed.\n`;
    text += `2. Mouthguards & shinguards are strictly mandatory for all youth participants.\n`;
    text += `3. Return all balls and bibs to the designated sector bins at the end of the slot.\n\n`;
    text += `Best regards,\nRichard Couse\nDirector of Coaching / Head of Youth\nOld Alexandra Hockey Club\nMilltown, Dublin 6`;

    // Rich HTML version for direct clipboard copy (ready to paste in Gmail/Outlook)
    let rowsHtml = '';
    slots.forEach((s) => {
      const sector = sectors.find((sec) => sec.id === s.pitchSectorId);
      const assignedCoaches = s.assignedCoachIds
        .map((id) => coaches.find((c) => c.id === id)?.name || id)
        .join(', ') || 'Unassigned';

      rowsHtml += `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 12px; font-weight: bold; color: #111827; font-family: sans-serif; font-size: 13px;">${s.timeSlot}</td>
          <td style="padding: 10px 12px; color: #7f1d1d; font-weight: bold; font-family: sans-serif; font-size: 13px;">${sector?.code || s.pitchSectorId}</td>
          <td style="padding: 10px 12px; color: #111827; font-weight: 600; font-family: sans-serif; font-size: 13px;">${s.ageGroupId} <span style="font-size: 11px; color: #6b7280; font-weight: normal;">(${s.pathway})</span></td>
          <td style="padding: 10px 12px; color: #374151; font-family: sans-serif; font-size: 13px;">${assignedCoaches}</td>
          <td style="padding: 10px 12px; color: #4b5563; font-family: sans-serif; font-size: 12px;">${s.sessionTitle}</td>
        </tr>
      `;
    });

    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 750px; margin: 0 auto; color: #1f2937; line-height: 1.5;">
        <div style="background: #991b1b; padding: 24px; border-radius: 12px 12px 0 0; color: #ffffff;">
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold; color: #fca5a5;">Old Alexandra Hockey Club · Milltown</span>
          <h1 style="margin: 6px 0 0 0; font-size: 24px; font-weight: bold; color: #ffffff;">Sunday Master Coaching Schedule</h1>
          <p style="margin: 6px 0 0 0; font-size: 14px; color: #fee2e2;">📅 ${formattedDate} | Pitch 1 & 2 AstroTurf</p>
        </div>
        
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 14px; color: #374151;">Dear Old Alex Coaching Team,</p>
          <p style="font-size: 14px; color: #4b5563;">Below is our confirmed timetable and pitch sector breakdown for Sunday morning:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb; text-align: left;">
                <th style="padding: 10px 12px; font-size: 12px; font-weight: bold; color: #4b5563; text-transform: uppercase;">Time</th>
                <th style="padding: 10px 12px; font-size: 12px; font-weight: bold; color: #4b5563; text-transform: uppercase;">Sector</th>
                <th style="padding: 10px 12px; font-size: 12px; font-weight: bold; color: #4b5563; text-transform: uppercase;">Age Group</th>
                <th style="padding: 10px 12px; font-size: 12px; font-weight: bold; color: #4b5563; text-transform: uppercase;">Coaches</th>
                <th style="padding: 10px 12px; font-size: 12px; font-weight: bold; color: #4b5563; text-transform: uppercase;">Session Focus</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 14px; border-radius: 6px; margin: 20px 0;">
            <strong style="color: #991b1b; font-size: 13px;">Safety & Operational Checklist:</strong>
            <ul style="margin: 6px 0 0 0; padding-left: 20px; font-size: 13px; color: #7f1d1d;">
              <li><strong>Arrival:</strong> Lead coaches please arrive 15 minutes prior to collect gear bags from the Shed.</li>
              <li><strong>Mandatory Gear:</strong> Mouthguards & shinguards are strictly required for every player.</li>
              <li><strong>Wrap-up:</strong> Tidy up cones and balls to keep sector clean for the next age group.</li>
            </ul>
          </div>

          <p style="font-size: 13px; color: #374151; margin-top: 24px;">
            Thank you for your fantastic dedication to Old Alex Youth Hockey!<br>
            <strong>Richard Couse</strong><br>
            <span style="color: #6b7280; font-size: 12px;">Director of Coaching / Head of Youth · Old Alexandra HC</span>
          </p>
        </div>
      </div>
    `;

    return { subject, text, html };
  },

  /**
   * Generates Age Group Parent Circular Email
   */
  generateAgeGroupParentEmail(
    slot: SessionSlot,
    sector: PitchSector,
    dateStr: string,
    coaches: Coach[]
  ): { subject: string; text: string; html: string } {
    const formattedDate = new Date(dateStr).toLocaleDateString('en-IE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const assignedCoaches = slot.assignedCoachIds
      .map((id) => coaches.find((c) => c.id === id)?.name || id)
      .join(' & ') || 'Old Alex Coaching Team';

    const subject = `Old Alex Junior Hockey — ${slot.ageGroupId} Session Details (${formattedDate})`;

    const text = `OLD ALEXANDRA HOCKEY CLUB — JUNIOR SECTION
Age Group: ${slot.ageGroupId} (${slot.pathway} Pathway)
Date: ${formattedDate}
Session Time: ${slot.timeSlot}
Pitch Location: ${sector.name} (${sector.code}) — Milltown

Dear Parents and Players,

We are looking forward to our training session this Sunday at Milltown!

SESSION INFORMATION:
• Time: ${slot.timeSlot} (Please arrive 10 minutes before pushback)
• Pitch Sector: ${sector.name} (${sector.code})
• Lead Coaches: ${assignedCoaches}
• Focus: ${slot.sessionTitle} ${slot.keyFocus ? `— ${slot.keyFocus}` : ''}

SAFETY & EQUIPMENT CHECKLIST:
1. Mouthguard (Gumshield): MANDATORY. Players without a mouthguard will not be permitted to train for safety reasons.
2. Shinguards: Strictly required under hockey socks.
3. Footwear: Astro turf hockey runners (No metal blades or football studs).
4. Weather: Bring a named water bottle and a warm/waterproof top layer.

DROP-OFF & COLLECTION:
• Drop-off via the Pavilion Gate 10 minutes prior to session start.
• Please ensure prompt collection at the dugout at ${slot.endTime || slot.timeSlot.split('–')[1]?.trim() || 'finish'}.

Looking forward to a great session! Go Alex!

Best regards,
${assignedCoaches} & Richard Couse
Old Alex Junior Hockey Committee`;

    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 650px; margin: 0 auto; color: #1f2937; line-height: 1.6;">
        <div style="background: #991b1b; padding: 24px; border-radius: 12px 12px 0 0; color: #ffffff;">
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold; color: #fca5a5;">Old Alex Junior Hockey</span>
          <h1 style="margin: 6px 0 0 0; font-size: 22px; font-weight: bold; color: #ffffff;">${slot.ageGroupId} Sunday Training</h1>
          <p style="margin: 6px 0 0 0; font-size: 14px; color: #fee2e2;">📅 ${formattedDate} · ⏰ ${slot.timeSlot}</p>
        </div>

        <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 14px;">Dear ${slot.ageGroupId} Parents & Players,</p>
          <p style="font-size: 14px;">Here are your session details for this coming Sunday at Milltown:</p>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #6b7280; width: 120px;"><strong>Pitch Sector:</strong></td>
                <td style="padding: 6px 0; color: #111827; font-weight: bold;">${sector.name} (${sector.code})</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;"><strong>Time Slot:</strong></td>
                <td style="padding: 6px 0; color: #111827; font-weight: bold;">${slot.timeSlot}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;"><strong>Coaching Team:</strong></td>
                <td style="padding: 6px 0; color: #111827;">${assignedCoaches}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;"><strong>Session Focus:</strong></td>
                <td style="padding: 6px 0; color: #111827;">${slot.sessionTitle}</td>
              </tr>
            </table>
          </div>

          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px; border-radius: 6px; margin: 16px 0;">
            <strong style="color: #92400e; font-size: 13px;">Mandatory Safety Requirements:</strong>
            <ul style="margin: 6px 0 0 0; padding-left: 20px; font-size: 13px; color: #78350f;">
              <li><strong>Mouthguard (Gumshield):</strong> Strictly required for all players.</li>
              <li><strong>Shinguards:</strong> Must be worn under hockey socks.</li>
              <li><strong>Footwear:</strong> Astro runners only (No metal studs).</li>
              <li><strong>Hydration:</strong> Named water bottle.</li>
            </ul>
          </div>

          <p style="font-size: 13px; color: #4b5563;">
            Drop-off & pick-up via the Pavilion main gate. See you on the pitch!<br><br>
            <strong>Old Alex Junior Coaching Team</strong>
          </p>
        </div>
      </div>
    `;

    return { subject, text, html };
  },

  /**
   * Generates Coaches Availability Callout Email
   */
  generateCoachAvailabilityEmail(
    dateStr: string,
    coaches: Coach[]
  ): { subject: string; text: string; html: string } {
    const formattedDate = new Date(dateStr).toLocaleDateString('en-IE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    const subject = `Old Alex Coaching Roster — Availability Check for Sunday ${formattedDate}`;

    const text = `OLD ALEXANDRA HOCKEY CLUB — COACHING ROSTER
Date: Sunday ${formattedDate}
Recipient: All Old Alex Lead Coaches & Apprentices (Coaching Roster)

Hi Team,

We are putting together our coaching timetable for Sunday ${formattedDate} across Pitches 1, 2, and 3.

Please let us know your availability for this coming Sunday by replying to this email or updating your status via WhatsApp:
1. Available full morning (09:00 - 13:00)
2. Morning only (09:00 - 11:30)
3. Late morning / Midday (11:30 - 14:00)
4. Senior EYHL / Leinster League match commitment
5. Away / Unavailable

Please send your confirmation by Thursday 18:00 so we can finalize pitch sector assignments.

Thank you for your fantastic work with our youth players!

Warm regards,
Richard Couse
Director of Coaching / Head of Youth
Old Alexandra Hockey Club`;

    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6;">
        <div style="background: #991b1b; padding: 22px; border-radius: 12px 12px 0 0; color: #ffffff;">
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold; color: #fca5a5;">Old Alex Coaching Hub</span>
          <h1 style="margin: 6px 0 0 0; font-size: 22px; font-weight: bold; color: #ffffff;">Sunday Availability Callout</h1>
          <p style="margin: 4px 0 0 0; font-size: 14px; color: #fee2e2;">📅 ${formattedDate} · Milltown Astro</p>
        </div>

        <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 14px;">Hi Team,</p>
          <p style="font-size: 14px;">Please confirm your coaching availability for this coming Sunday (<strong>${formattedDate}</strong>):</p>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin: 16px 0;">
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #374151;">Available Status Options:</p>
            <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #4b5563;">
              <li><strong>Available Full Morning:</strong> 09:00 - 13:00</li>
              <li><strong>Early Morning Only:</strong> 09:00 - 11:15</li>
              <li><strong>Midday Only:</strong> 11:30 - 14:00</li>
              <li><strong>Senior Match Commitment:</strong> EYHL / Leinster League</li>
              <li><strong>Unavailable / Away</strong></li>
            </ol>
          </div>

          <p style="font-size: 13px; color: #4b5563;">
            Please reply directly to this email or drop a quick note in the Coaches WhatsApp group by Thursday evening.<br><br>
            Thank you!<br>
            <strong>Richard Couse</strong><br>
            <span style="color: #6b7280; font-size: 12px;">Director of Coaching / Head of Youth</span>
          </p>
        </div>
      </div>
    `;

    return { subject, text, html };
  },

  /**
   * Opens user's default email client via mailto
   */
  openMailto(subject: string, body: string, recipient = ''): void {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    const url = `mailto:${recipient}?subject=${encodedSubject}&body=${encodedBody}`;
    window.location.href = url;
  },

  /**
   * Copy rich HTML and plain text simultaneously to clipboard
   */
  async copyRichEmailToClipboard(html: string, text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const textBlob = new Blob([text], { type: 'text/plain' });
        const htmlBlob = new Blob([html], { type: 'text/html' });
        const item = new ClipboardItem({
          'text/plain': textBlob,
          'text/html': htmlBlob,
        });
        await navigator.clipboard.write([item]);
        return true;
      }
    } catch {
      // Fallback to text copy
    }

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  },

  // ==========================================
  // 3. SPREADSHEET (CSV) EXPORTS
  // ==========================================

  exportTimetableToCSV(
    slots: SessionSlot[],
    coaches: Coach[],
    sectors: PitchSector[],
    drills: Drill[],
    dateStr: string
  ): void {
    const headers = [
      'Date',
      'Time Slot',
      'Pitch Sector',
      'Pitch Code',
      'Age Group',
      'Pathway',
      'Assigned Coaches',
      'Session Title',
      'Session Purpose',
      'Key Coaching Focus',
      'Attached Drills',
      'Status',
    ];

    const rows = slots.map((s) => {
      const sector = sectors.find((p) => p.id === s.pitchSectorId);
      const coachNames = s.assignedCoachIds
        .map((cid) => coaches.find((c) => c.id === cid)?.name || cid)
        .join('; ');

      const slotDrillIds = s.drillIds || s.attachedDrillIds || [];
      const drillTitles = drills
        .filter((d) => slotDrillIds.includes(d.id))
        .map((d) => d.title)
        .join('; ');

      return [
        `"${s.date || dateStr}"`,
        `"${s.timeSlot}"`,
        `"${sector?.name || s.pitchSectorId}"`,
        `"${sector?.code || ''}"`,
        `"${s.ageGroupId}"`,
        `"${s.pathway}"`,
        `"${coachNames.replace(/"/g, '""')}"`,
        `"${(s.sessionTitle || '').replace(/"/g, '""')}"`,
        `"${(s.sessionPurpose || '').replace(/"/g, '""')}"`,
        `"${(s.keyFocus || s.coachNotes || '').replace(/"/g, '""')}"`,
        `"${drillTitles.replace(/"/g, '""')}"`,
        `"${s.status}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadFile(csvContent, `oldalex-sunday-timetable-${dateStr}.csv`, 'text/csv;charset=utf-8;');
  },

  exportCoachesToCSV(coaches: Coach[], availability: CoachAvailability[]): void {
    const headers = [
      'Coach Name',
      'Role',
      'Email',
      'Phone',
      'Initials',
      'Active Status',
      'Latest Availability Status',
      'Availability Notes',
    ];

    const rows = coaches.map((c) => {
      const avail = availability.find((a) => a.coachId === c.id);
      return [
        `"${c.name}"`,
        `"${c.role}"`,
        `"${c.email}"`,
        `"${c.phone}"`,
        `"${c.initials}"`,
        `"${c.isActive ? 'Active' : 'Inactive'}"`,
        `"${avail?.status || 'NOT_LOGGED'}"`,
        `"${(avail?.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadFile(csvContent, `oldalex-coaches-roster.csv`, 'text/csv;charset=utf-8;');
  },

  exportFixturesToCSV(fixtures: MatchFixture[]): void {
    const headers = [
      'Date',
      'Pushback Time',
      'Team / Squad',
      'Competition',
      'Opposition',
      'Venue',
      'Home/Away',
      'Lead Coach / Manager',
      'Umpires',
      'Status',
      'Result / Score',
    ];

    const rows = fixtures.map((f) => {
      const score =
        f.homeScore !== undefined && f.awayScore !== undefined
          ? `${f.homeScore} - ${f.awayScore}`
          : f.result || '';

      return [
        `"${f.date}"`,
        `"${f.pushbackTime}"`,
        `"${f.ageGroupOrTeam}"`,
        `"${f.competition}"`,
        `"${f.opposition}"`,
        `"${f.venue}"`,
        `"${f.isHome ? 'Home' : 'Away'}"`,
        `"${f.leadCoachOrManager}"`,
        `"${f.umpires.join('; ')}"`,
        `"${f.status}"`,
        `"${score}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadFile(csvContent, `oldalex-match-fixtures.csv`, 'text/csv;charset=utf-8;');
  },

  exportDrillsToCSV(drills: Drill[]): void {
    const headers = [
      'Title',
      'Pathway',
      'Skill Area',
      'Duration (Mins)',
      'Min Players',
      'Max Players',
      'Target Age Groups',
      'Equipment Needed',
      'Setup Description',
      'Key Coaching Points',
    ];

    const rows = drills.map((d) => [
      `"${d.title.replace(/"/g, '""')}"`,
      `"${d.pathway}"`,
      `"${d.skill}"`,
      `"${d.durationMinutes}"`,
      `"${d.minPlayers}"`,
      `"${d.maxPlayers}"`,
      `"${d.targetAgeGroups.join('; ')}"`,
      `"${d.equipment.join('; ').replace(/"/g, '""')}"`,
      `"${d.setup.replace(/"/g, '""')}"`,
      `"${d.coachingPoints.join(' | ').replace(/"/g, '""')}"`,
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadFile(csvContent, `oldalex-drill-library.csv`, 'text/csv;charset=utf-8;');
  },

  // ==========================================
  // 4. CALENDAR (.ICS) GENERATOR
  // ==========================================

  exportSundayCalendarICS(
    slots: SessionSlot[],
    coaches: Coach[],
    sectors: PitchSector[],
    dateStr: string
  ): void {
    let ics = `BEGIN:VCALENDAR\r\n`;
    ics += `VERSION:2.0\r\n`;
    ics += `PRODID:-//Old Alexandra Hockey Club//Coaching Hub//EN\r\n`;
    ics += `CALSCALE:GREGORIAN\r\n`;
    ics += `METHOD:PUBLISH\r\n`;
    ics += `X-WR-CALNAME:Old Alex HC Sunday Sessions\r\n`;
    ics += `X-WR-TIMEZONE:Europe/Dublin\r\n`;

    const cleanDate = dateStr.replace(/-/g, '');

    slots.forEach((s) => {
      const sector = sectors.find((sec) => sec.id === s.pitchSectorId);
      const assigned = s.assignedCoachIds
        .map((cid) => coaches.find((c) => c.id === cid)?.name || cid)
        .join(', ');

      // Parse start and end times e.g. "09:00" or "09:00–10:15"
      const times = s.timeSlot.includes('–')
        ? s.timeSlot.split('–').map((t) => t.trim())
        : s.timeSlot.includes('-')
        ? s.timeSlot.split('-').map((t) => t.trim())
        : [s.startTime || '09:00', s.endTime || '10:15'];

      const startParts = (times[0] || '09:00').split(':');
      const endParts = (times[1] || '10:15').split(':');

      const dtStart = `${cleanDate}T${pad(startParts[0])}${pad(startParts[1])}00`;
      const dtEnd = `${cleanDate}T${pad(endParts[0])}${pad(endParts[1])}00`;

      const summary = `Old Alex ${s.ageGroupId} Hockey (${sector?.code || s.pitchSectorId})`;
      const location = `Old Alexandra HC, ${sector?.name || 'Milltown Pitches'}, Milltown, Dublin 6`;
      const description = `Coaching Slot: ${s.sessionTitle}\\nPathway: ${s.pathway}\\nCoaches: ${assigned || 'TBC'}\\nFocus: ${s.keyFocus || s.coachNotes || 'Technical & Match Play'}`;

      ics += `BEGIN:VEVENT\r\n`;
      ics += `UID:oldalex-${s.id}-${cleanDate}@oldalex.ie\r\n`;
      ics += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
      ics += `DTSTART:${dtStart}\r\n`;
      ics += `DTEND:${dtEnd}\r\n`;
      ics += `SUMMARY:${escapeICS(summary)}\r\n`;
      ics += `LOCATION:${escapeICS(location)}\r\n`;
      ics += `DESCRIPTION:${escapeICS(description)}\r\n`;
      ics += `STATUS:CONFIRMED\r\n`;
      ics += `END:VEVENT\r\n`;
    });

    ics += `END:VCALENDAR\r\n`;

    downloadFile(ics, `oldalex-schedule-${dateStr}.ics`, 'text/calendar;charset=utf-8;');
  },

  // ==========================================
  // 5. DIRECTOR DATA VAULT & SINGLE-USER BACKUP
  // ==========================================

  downloadFullBackupJSON(data: HubBackupData): void {
    const jsonStr = JSON.stringify(data, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(
      jsonStr,
      `oldalex-director-hub-backup-${dateStr}.json`,
      'application/json;charset=utf-8;'
    );
  },

  validateAndParseBackup(jsonString: string): HubBackupData | null {
    try {
      const parsed = JSON.parse(jsonString);
      if (
        parsed &&
        Array.isArray(parsed.slots) &&
        Array.isArray(parsed.drills) &&
        Array.isArray(parsed.coaches)
      ) {
        return {
          version: parsed.version || '1.0',
          exportedAt: parsed.exportedAt || new Date().toISOString(),
          director: parsed.director || 'Richard Couse',
          slots: parsed.slots || [],
          drills: parsed.drills || [],
          coaches: parsed.coaches || [],
          availability: Array.isArray(parsed.availability) ? parsed.availability : [],
          sectorGear: Array.isArray(parsed.sectorGear) ? parsed.sectorGear : [],
          firstAid: Array.isArray(parsed.firstAid) ? parsed.firstAid : [],
          fixtures: Array.isArray(parsed.fixtures) ? parsed.fixtures : [],
          players: Array.isArray(parsed.players) ? parsed.players : [],
          whatsAppGroups: Array.isArray(parsed.whatsAppGroups) ? parsed.whatsAppGroups : [],
          blitzTournaments: Array.isArray(parsed.blitzTournaments) ? parsed.blitzTournaments : [],
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  // ==========================================
  // 6. CLIENT-SIDE DIGITAL PDF SUITE (OFFLINE)
  // ==========================================

  /**
   * Generates Complete Sunday Master Digital Document (HTML for instant PDF)
   */
  generateSundayMasterPDFHtml(
    dateStr: string,
    slots: SessionSlot[],
    coaches: Coach[],
    sectors: PitchSector[],
    drills: Drill[],
    customNote?: string
  ): string {
    const formattedDate = new Date(dateStr).toLocaleDateString('en-IE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const timeSlots = Array.from(new Set(slots.map((s) => s.timeSlot))).sort();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Old Alex HC — Sunday Master Briefing (${formattedDate})</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #ffffff; color: #111827; font-size: 11pt; line-height: 1.4; }
    .header { background: #4a154b; color: #ffffff; padding: 18px 24px; border-radius: 12px; margin-bottom: 16px; border-bottom: 4px solid #f59e0b; }
    .header-top { display: flex; justify-content: space-between; align-items: center; }
    .club-title { font-size: 20pt; font-weight: 800; letter-spacing: -0.5px; margin: 0; color: #ffffff; }
    .club-subtitle { font-size: 9pt; text-transform: uppercase; letter-spacing: 2px; color: #fde68a; font-weight: 700; margin-top: 3px; }
    .date-badge { background: #ffffff; color: #4a154b; padding: 6px 14px; border-radius: 8px; font-weight: 700; font-size: 11pt; }
    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .kpi-card { background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; }
    .kpi-val { font-size: 14pt; font-weight: 800; color: #4a154b; margin: 0; }
    .kpi-lbl { font-size: 8pt; text-transform: uppercase; color: #6b7280; font-weight: 600; margin: 2px 0 0 0; }
    .section-title { font-size: 12pt; font-weight: 800; color: #4a154b; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin: 18px 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 9.5pt; }
    th { background: #4a154b; color: #ffffff; text-align: left; padding: 8px 10px; font-weight: 700; font-size: 8.5pt; text-transform: uppercase; }
    td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    tr:nth-child(even) td { background: #fdfaf7; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 8pt; font-weight: 700; text-transform: uppercase; }
    .badge-p1n { background: #fee2e2; color: #991b1b; }
    .badge-p1s { background: #fef3c7; color: #92400e; }
    .badge-p2n { background: #e0f2fe; color: #075985; }
    .badge-p2s { background: #dcfce7; color: #166534; }
    .badge-p3 { background: #f3e8ff; color: #6b21a8; }
    .path-found { color: #059669; font-weight: 700; }
    .path-dev { color: #2563eb; font-weight: 700; }
    .path-perf { color: #b91c1c; font-weight: 700; }
    .notice-box { background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin: 14px 0; font-size: 9.5pt; color: #92400e; }
    .footer { border-top: 2px solid #e5e7eb; padding-top: 10px; margin-top: 20px; font-size: 8.5pt; color: #6b7280; display: flex; justify-content: space-between; align-items: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-top">
      <div>
        <h1 class="club-title">OLD ALEXANDRA HOCKEY CLUB</h1>
        <div class="club-subtitle">Junior Section · Sunday Master Coaching Briefing</div>
      </div>
      <div class="date-badge">📅 ${formattedDate}</div>
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi-card">
      <div class="kpi-val">${slots.length}</div>
      <div class="kpi-lbl">Active Sessions</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-val">${sectors.length} Sectors</div>
      <div class="kpi-lbl">P1, P2 & P3 Cage</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-val">10 Groups</div>
      <div class="kpi-lbl">PEN to Inters</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-val">Richard Couse</div>
      <div class="kpi-lbl">Director of Coaching</div>
    </div>
  </div>

  ${customNote && customNote.trim() ? `
  <div class="notice-box">
    <strong>📢 DIRECTOR'S WEEKLY NOTICE:</strong><br>
    ${customNote.trim()}
  </div>
  ` : ''}

  <div class="section-title">Confirmed Pitch Allocations & Timetable</div>
  <table>
    <thead>
      <tr>
        <th style="width: 14%;">Time</th>
        <th style="width: 12%;">Pitch</th>
        <th style="width: 15%;">Age Group</th>
        <th style="width: 25%;">Assigned Coaches</th>
        <th style="width: 34%;">Session Focus & Key Topic</th>
      </tr>
    </thead>
    <tbody>
      ${slots.map((s) => {
        const sec = sectors.find((sec) => sec.id === s.pitchSectorId);
        const assigned = s.assignedCoachIds
          .map((id) => coaches.find((c) => c.id === id)?.name || id)
          .join(', ') || 'Needs Coach';
        const badgeClass = `badge-${s.pitchSectorId.toLowerCase()}`;
        const pathClass = s.pathway === 'Foundation' ? 'path-found' : s.pathway === 'Development' ? 'path-dev' : 'path-perf';

        return `
        <tr>
          <td><strong>${s.timeSlot}</strong></td>
          <td><span class="badge ${badgeClass}">${sec?.code || s.pitchSectorId.toUpperCase()}</span></td>
          <td><strong>${s.ageGroupId}</strong><br><span class="${pathClass}" style="font-size: 7.5pt;">${s.pathway}</span></td>
          <td>${assigned}</td>
          <td>
            <strong>${s.sessionTitle}</strong>
            ${s.keyFocus ? `<br><span style="color: #4b5563; font-size: 8pt;">🎯 ${s.keyFocus}</span>` : ''}
          </td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>

  <div class="section-title">Emergency & Safety Protocols (Milltown)</div>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 9pt; background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 12px 16px;">
    <div>
      <strong style="color: #991b1b;">⚠️ Player Safety Check:</strong>
      <ul style="margin: 4px 0 0 0; padding-left: 18px; color: #374151;">
        <li>Mouthguards (gumshields) strictly mandatory for all youth players.</li>
        <li>Shinguards compulsory under hockey socks.</li>
        <li>No players allowed on turf without protective gear.</li>
      </ul>
    </div>
    <div>
      <strong style="color: #4a154b;">📍 Facility & First Aid:</strong>
      <ul style="margin: 4px 0 0 0; padding-left: 18px; color: #374151;">
        <li>First Aid Kit located in Main Pavilion Foyer.</li>
        <li>Ice packs stored in Clubhouse kitchen freezer.</li>
        <li>Defibrillator (AED) mounted in Clubhouse hallway.</li>
        <li>Director of Coaching: Richard Couse (+353 87 234 5678).</li>
      </ul>
    </div>
  </div>

  <div class="footer">
    <span>Old Alexandra Hockey Club · Milltown, Dublin 6 · Coaching Hub 2026/2027</span>
    <span>Generated by Director of Coaching</span>
  </div>
</body>
</html>`;
  },

  /**
   * Generates Focused 1-Page Sector / Age Group Digital Card (HTML for instant PDF)
   */
  generateSlot1PagePDFHtml(
    slot: SessionSlot,
    coaches: Coach[],
    sector: PitchSector,
    drills: Drill[],
    dateStr: string,
    customNote?: string
  ): string {
    const formattedDate = new Date(dateStr).toLocaleDateString('en-IE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const assigned = slot.assignedCoachIds
      .map((id) => coaches.find((c) => c.id === id)?.name || id)
      .join(', ') || 'Unassigned (Needs Coach)';

    const slotDrillIds = slot.drillIds || slot.attachedDrillIds || [];
    const attachedDrills = drills.filter((d) => slotDrillIds.includes(d.id));

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Old Alex HC — ${slot.ageGroupId} Coaching Card (${slot.pitchSectorId.toUpperCase()})</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #ffffff; color: #111827; font-size: 10.5pt; line-height: 1.4; }
    .header { background: #4a154b; color: #ffffff; padding: 16px 20px; border-radius: 12px; margin-bottom: 14px; border-bottom: 4px solid #f59e0b; display: flex; justify-content: space-between; align-items: center; }
    .squad-title { font-size: 22pt; font-weight: 800; letter-spacing: -0.5px; margin: 0; color: #ffffff; }
    .squad-sub { font-size: 9pt; text-transform: uppercase; letter-spacing: 1.5px; color: #fde68a; font-weight: 700; margin-top: 2px; }
    .time-badge { background: #ffffff; color: #4a154b; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 13pt; text-align: right; }
    .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }
    .meta-card { background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
    .meta-val { font-size: 11pt; font-weight: 800; color: #4a154b; margin: 0; }
    .meta-lbl { font-size: 7.5pt; text-transform: uppercase; color: #6b7280; font-weight: 700; margin-top: 2px; }
    .focus-card { background: #fdfaf7; border-left: 4px solid #f59e0b; border: 1.5px solid #fed7aa; border-left-width: 5px; border-radius: 8px; padding: 12px 16px; margin-bottom: 14px; }
    .section-head { font-size: 10.5pt; font-weight: 800; color: #4a154b; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; padding-bottom: 4px; margin: 14px 0 8px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 9pt; }
    th { background: #4a154b; color: #ffffff; text-align: left; padding: 6px 10px; font-weight: 700; font-size: 8pt; text-transform: uppercase; }
    td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) td { background: #fdfaf7; }
    .drill-box { background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; }
    .drill-title { font-weight: 800; color: #4a154b; font-size: 10pt; }
    .drill-meta { font-size: 8pt; color: #6b7280; margin: 2px 0 6px 0; }
    .drill-points { margin: 4px 0 0 0; padding-left: 18px; font-size: 8.5pt; color: #374151; }
    .checklist-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
    .check-tag { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; border-radius: 6px; padding: 3px 8px; font-size: 8pt; font-weight: 600; }
    .footer { border-top: 1.5px solid #e5e7eb; padding-top: 8px; margin-top: 14px; font-size: 8pt; color: #6b7280; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="squad-sub">Old Alex Youth · ${slot.pathway} Pathway</div>
      <h1 class="squad-title">${slot.ageGroupId.toUpperCase()}</h1>
    </div>
    <div class="time-badge">
      ${slot.timeSlot}
      <div style="font-size: 8pt; font-weight: 600; color: #6b7280; text-transform: uppercase;">${sector.name} (${sector.code})</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-card">
      <div class="meta-val">${sector.name}</div>
      <div class="meta-lbl">Pitch Location</div>
    </div>
    <div class="meta-card">
      <div class="meta-val">${assigned}</div>
      <div class="meta-lbl">Assigned Coaching Team</div>
    </div>
    <div class="meta-card">
      <div class="meta-val">${formattedDate}</div>
      <div class="meta-lbl">Date (Milltown)</div>
    </div>
  </div>

  <div class="focus-card">
    <div style="font-weight: 800; font-size: 11pt; color: #9a3412;">🎯 Session Title: ${slot.sessionTitle}</div>
    ${slot.sessionPurpose ? `<div style="font-size: 9pt; color: #431407; margin-top: 4px;">${slot.sessionPurpose}</div>` : ''}
    ${slot.keyFocus ? `<div style="font-size: 8.5pt; color: #7c2d12; margin-top: 4px;"><strong>Emphasis:</strong> ${slot.keyFocus}</div>` : ''}
  </div>

  ${slot.runningOrder && slot.runningOrder.length > 0 ? `
  <div class="section-head">Session Running Order</div>
  <table>
    <thead>
      <tr>
        <th style="width: 10%;">#</th>
        <th style="width: 50%;">Activity / Training Phase</th>
        <th style="width: 15%;">Duration</th>
        <th style="width: 25%;">Coaching Key Focus</th>
      </tr>
    </thead>
    <tbody>
      ${slot.runningOrder.map((r, i) => `
      <tr>
        <td><strong>0${i + 1}</strong></td>
        <td><strong>${r.activity}</strong></td>
        <td>${r.durationMins} mins</td>
        <td style="color: #4b5563;">${r.notes || 'High engagement & tempo'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  ` : ''}

  ${attachedDrills.length > 0 ? `
  <div class="section-head">Attached Curriculum Drills (${attachedDrills.length})</div>
  ${attachedDrills.map((d) => `
  <div class="drill-box">
    <div style="display: flex; justify-content: space-between;">
      <span class="drill-title">${d.title}</span>
      <span style="font-size: 8.5pt; font-weight: 700; color: #4a154b;">${d.durationMinutes} mins · ${d.skill}</span>
    </div>
    <div class="drill-meta">Setup: ${d.setup}</div>
    <ul class="drill-points">
      ${d.coachingPoints.slice(0, 3).map((pt) => `<li>${pt}</li>`).join('')}
    </ul>
  </div>`).join('')}
  ` : ''}

  <div class="section-head">Kit Shed Equipment & Gear Checklist</div>
  <div class="checklist-row">
    ${slot.equipmentChecklist.map((eq) => `
    <span class="check-tag">✓ ${eq.item}</span>
    `).join('')}
  </div>

  ${slot.coachNotes ? `
  <div style="margin-top: 10px; font-size: 8.5pt; color: #4b5563; background: #f3f4f6; border-radius: 6px; padding: 8px 12px;">
    <strong>Director's Pitchside Note:</strong> ${slot.coachNotes}
  </div>
  ` : ''}

  <div class="footer">
    <span>Old Alexandra Hockey Club · Director of Coaching: Richard Couse</span>
    <span>Mandatory: Mouthguards & Shinguards for all players</span>
  </div>
</body>
</html>`;
  },

  /**
   * Triggers client-side print/save-as-PDF in a clean, isolated view
   */
  printOrSavePDF(htmlContent: string, documentTitle = 'Old-Alex-Sunday-Briefing'): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to open the digital PDF view.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.document.title = documentTitle;

    // Wait for content to render and trigger print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  },

  /**
   * Generates Monthly Coaching Hours and Timetable CSV report
   */
  exportMonthlyReportCSV(slots: SessionSlot[], coaches: Coach[], sectors: PitchSector[]): string {
    const headers = [
      'Date',
      'Time Slot',
      'Pitch Sector',
      'Age Group',
      'Pathway',
      'Assigned Coaches',
      'Session Title',
      'Status',
    ];

    const rows = slots.map((s) => {
      const sector = sectors.find((p) => p.id === s.pitchSectorId)?.name || s.pitchSectorId;
      const coachNames = s.assignedCoachIds
        .map((cid) => coaches.find((c) => c.id === cid)?.name || cid)
        .join('; ');

      return [
        `"${s.date}"`,
        `"${s.timeSlot}"`,
        `"${sector}"`,
        `"${s.ageGroupId}"`,
        `"${s.pathway}"`,
        `"${coachNames}"`,
        `"${s.sessionTitle.replace(/"/g, '""')}"`,
        `"${s.status}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },
};

// Helper utilities
function pad(numStr?: string): string {
  const n = parseInt(numStr || '0', 10);
  return n < 10 ? `0${n}` : `${n}`;
}

function escapeICS(str: string): string {
  return str.replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
