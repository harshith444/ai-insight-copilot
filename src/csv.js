import { readFileSync } from "node:fs";

export function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",");

  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(
      headers.map((header, index) => {
        const value = values[index];
        const numeric = Number(value);
        return [header, Number.isNaN(numeric) || value.trim() === "" ? value : numeric];
      })
    );
  });
}

export function loadCsv(path) {
  return parseCsv(readFileSync(path, "utf8"));
}
