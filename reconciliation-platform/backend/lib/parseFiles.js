/**
 * Parse uploaded file buffer to array of row objects.
 * Supports CSV (text/csv, .csv) and JSON (application/json, .json).
 */

export function parseToRows(buffer, mimetype, filename = "") {
  const str = buffer.toString("utf-8");
  const isJson = mimetype?.includes("json") || filename.toLowerCase().endsWith(".json");
  if (isJson) return parseJson(str);
  return parseCsv(str);
}

function parseJson(str) {
  const data = JSON.parse(str);
  if (Array.isArray(data)) return data;
  return [data];
}

function parseCsv(str) {
  const lines = str.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return [];
  const header = lines[0].split(",").map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row = {};
    header.forEach((h, j) => {
      row[h] = values[j] !== undefined ? String(values[j]).trim() : "";
    });
    rows.push(row);
  }
  return rows;
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}
