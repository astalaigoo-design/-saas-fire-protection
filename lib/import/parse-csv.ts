/** Parse RFC 4180-style CSV text into header keys and row cell arrays. */
export type ParsedCsv = {
  headers: string[];
  rows: string[][];
};

function normalizeHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

/** Split CSV text into logical lines (handles quoted newlines). */
function splitCsvRecords(text: string): string[] {
  const records: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
      continue;
    }
    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      if (current.trim().length > 0) records.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  if (current.trim().length > 0) records.push(current);
  return records;
}

export function parseCsv(text: string): ParsedCsv {
  const trimmed = text.trim();
  if (!trimmed) {
    return { headers: [], rows: [] };
  }

  const lines = splitCsvRecords(trimmed);
  const parsedLines = lines.map(parseCsvLine);
  const [headerLine, ...dataLines] = parsedLines;
  if (!headerLine?.length) {
    return { headers: [], rows: [] };
  }

  const headers = headerLine.map(normalizeHeader);
  const width = headers.length;
  const rows = dataLines
    .map((cells) => {
      if (cells.every((cell) => cell === "")) return null;
      const row = cells.slice(0, width);
      while (row.length < width) row.push("");
      return row;
    })
    .filter((row): row is string[] => row !== null);

  return { headers, rows };
}

export function rowToRecord(headers: string[], cells: string[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (let i = 0; i < headers.length; i += 1) {
    const key = headers[i];
    if (!key) continue;
    record[key] = cells[i] ?? "";
  }
  return record;
}
