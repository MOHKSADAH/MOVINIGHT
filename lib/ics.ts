/** Build a minimal iCalendar document for movie nights. */
export function buildNightsIcs(
  nights: Array<{
    _id: string;
    title: string;
    date: number;
    status: string;
  }>,
  siteOrigin: string,
): string {
  const stamp = formatIcsUtc(Date.now());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Movie Night//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const night of nights) {
    if (night.status === "done") continue;
    const start = formatIcsUtc(night.date);
    const end = formatIcsUtc(night.date + 3 * 60 * 60 * 1000);
    const uid = `${night._id}@movie-night`;
    const summary = escapeIcs(night.title);
    const url = `${siteOrigin}/night/${night._id}`;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${summary}`,
      `URL:${url}`,
      `DESCRIPTION:${escapeIcs(`Movie Night · ${url}`)}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function formatIcsUtc(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${day}T${h}${min}${s}Z`;
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function downloadIcs(filename: string, contents: string) {
  const blob = new Blob([contents], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
