export interface CalendarEventData {
  title: string;
  description?: string;
  location?: string;
  dateStart?: string;
  dateEnd?: string;
  timeStart?: string;
  timeEnd?: string;
}

function formatDateForCalendar(dateStr?: string, timeStr?: string): string {
  if (!dateStr) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `${today}T080000`;
  }
  const cleanDate = dateStr.slice(0, 10).replace(/-/g, "");
  if (!timeStr) {
    return cleanDate;
  }
  const cleanTime = timeStr.replace(/[^0-9]/g, "").padEnd(4, "0").slice(0, 4);
  return `${cleanDate}T${cleanTime}00`;
}

export function generateGoogleCalendarUrl(event: CalendarEventData): string {
  const start = formatDateForCalendar(event.dateStart, event.timeStart);
  let end = formatDateForCalendar(event.dateEnd || event.dateStart, event.timeEnd);
  
  if (start === end && !event.timeStart) {
    const d = new Date(event.dateStart || Date.now());
    d.setDate(d.getDate() + 1);
    end = d.toISOString().slice(0, 10).replace(/-/g, "");
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details: `${event.description || ""}\n\nDiselenggarakan oleh Pemerintah Kelurahan Banjar Agung`,
    location: event.location || "Kelurahan Banjar Agung, Kota Serang",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateIcsContent(event: CalendarEventData): string {
  const start = formatDateForCalendar(event.dateStart, event.timeStart);
  const end = formatDateForCalendar(event.dateEnd || event.dateStart, event.timeEnd || event.timeStart);
  const now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const uid = `smartvil-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@kelbanjaragung.web.id`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kelurahan Banjar Agung//SmartVil Agenda//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title.replace(/\n/g, " ")}`,
    `DESCRIPTION:${(event.description || "").replace(/\n/g, "\\n")}`,
    `LOCATION:${(event.location || "Kelurahan Banjar Agung").replace(/\n/g, " ")}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcsFile(event: CalendarEventData, filename = "agenda-kelurahan.ics") {
  if (typeof window === "undefined") return;
  const ics = generateIcsContent(event);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
