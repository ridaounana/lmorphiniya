export function csvCell(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header, rows) {
  const lines = [header.map(csvCell).join(","), ...rows.map((row) => row.map(csvCell).join(","))];
  return lines.join("\n") + "\n";
}
