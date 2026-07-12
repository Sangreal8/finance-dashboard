import type { CsvRow } from "./types";

function parseCsvLine(line: string): string[] {
  const values: string[] = [];

  let currentValue = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (
      character === '"' &&
      insideQuotes &&
      nextCharacter === '"'
    ) {
      currentValue += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === "," && !insideQuotes) {
      values.push(currentValue.trim());
      currentValue = "";
      continue;
    }

    currentValue += character;
  }

  values.push(currentValue.trim());

  return values;
}

function splitCsvRecords(csv: string): string[] {
  const records: string[] = [];

  let currentRecord = "";
  let insideQuotes = false;

  const input = csv.replace(/^\uFEFF/, "");

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const nextCharacter = input[index + 1];

    if (
      character === '"' &&
      insideQuotes &&
      nextCharacter === '"'
    ) {
      currentRecord += '""';
      index += 1;
      continue;
    }

    if (character === '"') {
      insideQuotes = !insideQuotes;
      currentRecord += character;
      continue;
    }

    if (
      (character === "\n" || character === "\r") &&
      !insideQuotes
    ) {
      if (
        character === "\r" &&
        nextCharacter === "\n"
      ) {
        index += 1;
      }

      if (currentRecord.trim()) {
        records.push(currentRecord);
      }

      currentRecord = "";
      continue;
    }

    currentRecord += character;
  }

  if (currentRecord.trim()) {
    records.push(currentRecord);
  }

  return records;
}

export function parseCsv(csv: string): CsvRow[] {
  const records = splitCsvRecords(csv);

  if (records.length === 0) {
    return [];
  }

  const headers = parseCsvLine(records[0]).map(
    (header) => header.trim()
  );

  return records.slice(1).map((record) => {
    const values = parseCsvLine(record);

    return headers.reduce<CsvRow>(
      (row, header, index) => {
        row[header] = values[index]?.trim() ?? "";
        return row;
      },
      {}
    );
  });
}