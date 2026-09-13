import { JobAnalysisResult, TeamMember } from "../types";
import { getEffectiveJobDurationDays, getJobReference } from "./jobUtils";

/**
 * Calculates the array of ISO date strings (YYYY-MM-DD) spanned by a job
 * starting on startDate for a given number of working days.
 * Standard UK trade rule: whole working days (skips Saturdays and Sundays).
 */
export function calculateWorkingDateRange(
  startDateStr: string,
  durationDays: number,
  skipWeekends = true
): string[] {
  if (!startDateStr) return [];
  const wholeDays = Math.max(1, Math.round(durationDays || 1));
  const dates: string[] = [];

  const [year, month, day] = startDateStr.split("-").map(Number);
  if (!year || !month || !day) return [];

  const curr = new Date(year, month - 1, day);

  while (dates.length < wholeDays) {
    const dayOfWeek = curr.getDay(); // 0 = Sun, 6 = Sat
    if (!skipWeekends || (dayOfWeek !== 0 && dayOfWeek !== 6)) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, "0");
      const d = String(curr.getDate()).padStart(2, "0");
      dates.push(`${y}-${m}-${d}`);
    }
    curr.setDate(curr.getDate() + 1);
  }

  return dates;
}

export interface ConflictWarning {
  date: string;
  conflictingJobs: {
    id: string;
    title: string;
    ref: string;
    teamName: string;
    teamMembers: string[];
  }[];
  overlapDescription: string;
}

/**
 * Detects team or decorator double-booking conflicts across all active scheduled jobs
 */
export function detectTeamScheduleConflicts(
  jobs: JobAnalysisResult[],
  skipWeekends = true
): Record<string, ConflictWarning[]> {
  // Map of date -> list of jobs on that date
  const dateToJobMap = new Map<
    string,
    {
      job: JobAnalysisResult;
      teamName: string;
      members: string[];
    }[]
  >();

  for (const job of jobs) {
    if (job.archived || !job.startDate) continue;
    // Only jobs with active status on calendar
    if (job.status !== "SCHEDULED" && job.status !== "IN PROGRESS" && job.status !== "ACCEPTED") {
      continue;
    }

    const duration = getEffectiveJobDurationDays(job);
    const dates = calculateWorkingDateRange(job.startDate, duration, skipWeekends);
    const teamName = job.assignedTeam || "1 Man Team";
    const members = (job.assignedTeamMembers || job.team || []).map((m) => m.name.trim().toLowerCase());

    for (const date of dates) {
      if (!dateToJobMap.has(date)) {
        dateToJobMap.set(date, []);
      }
      dateToJobMap.get(date)!.push({ job, teamName, members });
    }
  }

  // Find overlaps where the same team or team member is scheduled twice on the same date
  const conflictsByJobId: Record<string, ConflictWarning[]> = {};

  for (const [date, entries] of dateToJobMap.entries()) {
    if (entries.length <= 1) continue;

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i];
        const b = entries[j];

        // Check if same team name OR overlapping individual members
        const sameTeam = a.teamName.toLowerCase() === b.teamName.toLowerCase();
        const sharedMember = a.members.find((m) => b.members.includes(m));

        if (sameTeam || sharedMember) {
          const reason = sharedMember
            ? `Team member "${sharedMember}" is assigned to both jobs on ${date}`
            : `Team "${a.teamName}" is scheduled for multiple jobs on ${date}`;

          const warning: ConflictWarning = {
            date,
            overlapDescription: reason,
            conflictingJobs: [
              {
                id: a.job.id,
                title: a.job.jobTitle,
                ref: getJobReference(a.job),
                teamName: a.teamName,
                teamMembers: a.members,
              },
              {
                id: b.job.id,
                title: b.job.jobTitle,
                ref: getJobReference(b.job),
                teamName: b.teamName,
                teamMembers: b.members,
              },
            ],
          };

          if (!conflictsByJobId[a.job.id]) conflictsByJobId[a.job.id] = [];
          if (!conflictsByJobId[b.job.id]) conflictsByJobId[b.job.id] = [];

          conflictsByJobId[a.job.id].push(warning);
          conflictsByJobId[b.job.id].push(warning);
        }
      }
    }
  }

  return conflictsByJobId;
}

/**
 * Generates an iCalendar (.ics) file string for Apple Calendar, Outlook, and Android
 */
export function generateIcsCalendarContent(job: JobAnalysisResult): string {
  if (!job.startDate) return "";
  const durationDays = getEffectiveJobDurationDays(job);
  const dates = calculateWorkingDateRange(job.startDate, durationDays, true);
  if (dates.length === 0) return "";

  const startDateStr = dates[0].replace(/-/g, "");
  // iCal DTEND for whole day events is exclusive, so it should be the day after the last day
  const lastDate = new Date(dates[dates.length - 1]);
  lastDate.setDate(lastDate.getDate() + 1);
  const endYear = lastDate.getFullYear();
  const endMonth = String(lastDate.getMonth() + 1).padStart(2, "0");
  const endDay = String(lastDate.getDate()).padStart(2, "0");
  const endDateStr = `${endYear}${endMonth}${endDay}`;

  const ref = getJobReference(job);
  const customerName = job.customer?.fullName || "Customer";
  const address = job.address || job.customer?.address || "On-site";
  const team = job.assignedTeam || "Trade Team";
  const notes = (job.notes || job.originalDescription || "").replace(/\n/g, "\\n");

  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Decorator AI//UK Job Management//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:job-${job.id}@decorator-ai.co.uk`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${startDateStr}`,
    `DTEND;VALUE=DATE:${endDateStr}`,
    `SUMMARY:🎨 ${job.jobTitle} - ${customerName} (${ref})`,
    `LOCATION:${address.replace(/,/g, "\\,")}`,
    `DESCRIPTION:Job Ref: ${ref}\\nCustomer: ${customerName}\\nAddress: ${address}\\nTeam: ${team}\\nDuration: ${durationDays} working day(s)\\n\\nNotes:\\n${notes}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Triggers a download of the .ics file on iOS / Safari / Chrome / Android
 */
export function downloadJobIcsFile(job: JobAnalysisResult): void {
  const content = generateIcsCalendarContent(job);
  if (!content) return;

  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const ref = getJobReference(job);
  a.download = `${ref}-${job.jobTitle.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Builds a direct Google Calendar web intent link
 */
export function getGoogleCalendarUrl(job: JobAnalysisResult): string {
  if (!job.startDate) return "";
  const durationDays = getEffectiveJobDurationDays(job);
  const dates = calculateWorkingDateRange(job.startDate, durationDays, true);
  if (dates.length === 0) return "";

  const startDateStr = dates[0].replace(/-/g, "");
  const lastDate = new Date(dates[dates.length - 1]);
  lastDate.setDate(lastDate.getDate() + 1);
  const endYear = lastDate.getFullYear();
  const endMonth = String(lastDate.getMonth() + 1).padStart(2, "0");
  const endDay = String(lastDate.getDate()).padStart(2, "0");
  const endDateStr = `${endYear}${endMonth}${endDay}`;

  const ref = getJobReference(job);
  const customerName = job.customer?.fullName || "Customer";
  const address = job.address || job.customer?.address || "";
  const team = job.assignedTeam || "Trade Team";
  const notes = job.notes || job.originalDescription || "";

  const title = encodeURIComponent(`🎨 ${job.jobTitle} - ${customerName} (${ref})`);
  const details = encodeURIComponent(
    `Job Ref: ${ref}\nCustomer: ${customerName}\nAddress: ${address}\nTeam: ${team}\nDuration: ${durationDays} working day(s)\n\nNotes:\n${notes}`
  );
  const location = encodeURIComponent(address);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateStr}/${endDateStr}&details=${details}&location=${location}`;
}
