import readXlsxFile from "read-excel-file";

export type XlsxCellValue = string | number | boolean | Date | null;

export interface XlsxWorkbook {
  headers: string[];
  rows: Array<Record<string, XlsxCellValue>>;
}

function normaliseHeader(value: XlsxCellValue) {
  return value === null ? "" : String(value).trim();
}

export async function readXlsxWorkbook(file: File): Promise<XlsxWorkbook> {
  const worksheet = (await readXlsxFile(file)) as XlsxCellValue[][];

  if (worksheet.length === 0) {
    throw new Error("The workbook does not contain any rows.");
  }

  const headers = worksheet[0].map(normaliseHeader);

  if (headers.every((header) => header.length === 0)) {
    throw new Error("The workbook does not contain a header row.");
  }

  const duplicateHeaders = headers.filter(
    (header, index) => header.length > 0 && headers.indexOf(header) !== index,
  );

  if (duplicateHeaders.length > 0) {
    throw new Error(
      `The workbook contains duplicate columns: ${[
        ...new Set(duplicateHeaders),
      ].join(", ")}.`,
    );
  }

  const rows = worksheet.slice(1).flatMap((values) => {
    const hasValue = values.some(
      (value) => value !== null && String(value).trim().length > 0,
    );

    if (!hasValue) {
      return [];
    }

    const row: Record<string, XlsxCellValue> = {};

    headers.forEach((header, index) => {
      if (header.length > 0) {
        row[header] = values[index] ?? null;
      }
    });

    return [row];
  });

  return {
    headers: headers.filter((header) => header.length > 0),
    rows,
  };
}
