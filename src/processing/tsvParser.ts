/**
 * TSV Parser with support for table headers and colspan handling.
 *
 * Features:
 * - Parses tab-separated values
 * - Recognizes [thead] markers for header rows
 * - Auto-extends last cell to span remaining columns when row has fewer cells
 */

export interface TsvCell {
  text: string;
  colspan: number;
  isHeader: boolean;
}

export interface TsvRow {
  cells: TsvCell[];
  isHeader: boolean;
}

export interface TsvTable {
  rows: TsvRow[];
  columnCount: number;
}

/**
 * Parse a TSV string into a structured table representation.
 * If a header row is missing cells, the last cell is treated as a colspan
 * extending to the end of the table.
 */
export function parseTsv(tsv: string): TsvTable {
  const lines = tsv.split("\n").filter((line) => line.trim() !== "");

  if (lines.length === 0) {
    return { rows: [], columnCount: 0 };
  }

  // First pass: parse all rows and determine max column count
  const rawRows: Array<{ cells: string[]; isHeader: boolean }> = [];
  let maxColumns = 0;

  for (const line of lines) {
    const cells = line.split("\t");
    const isHeader = cells[0]?.startsWith("[thead]") ?? false;

    // Clean the first cell if it has [thead] marker
    if (isHeader && cells.length > 0) {
      cells[0] = cells[0].replace(/^\[thead\]/, "").trim();
    }

    rawRows.push({ cells, isHeader });
    maxColumns = Math.max(maxColumns, cells.length);
  }

  // Second pass: build structured rows with colspan handling
  const rows: TsvRow[] = rawRows.map((rawRow) => {
    const { cells: rawCells, isHeader } = rawRow;

    // For header rows with fewer cells, find the last non-empty cell index
    let lastNonEmptyCellIndex = -1;
    if (isHeader && rawCells.length < maxColumns) {
      for (let i = rawCells.length - 1; i >= 0; i--) {
        if (rawCells[i].trim() !== "") {
          lastNonEmptyCellIndex = i;
          break;
        }
      }
    }

    const cells: TsvCell[] = [];

    for (let i = 0; i < rawCells.length; i++) {
      const text = rawCells[i].trim();

      // If this is the last non-empty cell in a header row with fewer cells,
      // extend it to span remaining columns (absorbing any trailing empty cells)
      let colspan = 1;
      if (isHeader && i === lastNonEmptyCellIndex && lastNonEmptyCellIndex !== -1) {
        colspan = maxColumns - i;
      }

      // Skip trailing empty cells after a colspan cell in header rows
      if (isHeader && lastNonEmptyCellIndex !== -1 && i > lastNonEmptyCellIndex) {
        continue;
      }

      cells.push({
        text,
        colspan,
        isHeader,
      });
    }

    return { cells, isHeader };
  });

  return { rows, columnCount: maxColumns };
}

/**
 * Convert a parsed table back to TSV format.
 * Colspan cells are represented by trailing empty cells.
 */
export function toTsv(table: TsvTable): string {
  const lines: string[] = [];

  for (const row of table.rows) {
    const cells: string[] = [];

    for (const cell of row.cells) {
      // Add header marker to first cell if this is a header row
      const prefix = row.isHeader && cells.length === 0 ? "[thead]" : "";
      cells.push(prefix + cell.text);

      // Add empty cells for colspan > 1
      for (let i = 1; i < cell.colspan; i++) {
        cells.push("");
      }
    }

    lines.push(cells.join("\t"));
  }

  return lines.join("\n");
}

/**
 * Get the effective column span for a cell at a given position.
 */
export function getCellSpan(row: TsvRow, cellIndex: number, columnCount: number): number {
  const cell = row.cells[cellIndex];
  if (!cell) return 1;

  return cell.colspan;
}
