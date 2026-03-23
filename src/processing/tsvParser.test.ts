import { describe, it, expect } from "vitest";
import { parseTsv, toTsv } from "./tsvParser.js";

describe("tsvParser", () => {
  describe("parseTsv", () => {
    it("should parse basic TSV", () => {
      const tsv = "A\tB\tC\n1\t2\t3";
      const table = parseTsv(tsv);

      expect(table.columnCount).toBe(3);
      expect(table.rows).toHaveLength(2);
      expect(table.rows[0].cells.map((c) => c.text)).toEqual(["A", "B", "C"]);
      expect(table.rows[1].cells.map((c) => c.text)).toEqual(["1", "2", "3"]);
    });

    it("should recognize [thead] marker for header rows", () => {
      const tsv = "[thead]Header1\tHeader2\n1\t2";
      const table = parseTsv(tsv);

      expect(table.rows[0].isHeader).toBe(true);
      expect(table.rows[0].cells[0].text).toBe("Header1");
      expect(table.rows[1].isHeader).toBe(false);
    });

    it("should extend last cell as colspan when header row is missing cells", () => {
      const tsv = `[thead]\tYear ended Dec. 31,\t
[thead](in millions)\t2024\t2023\t2022
**Operating activities:**\t\t\t`;

      const table = parseTsv(tsv);

      expect(table.columnCount).toBe(4);

      // First header row - "Year ended Dec. 31," should span columns 2-4 (colspan 3)
      expect(table.rows[0].isHeader).toBe(true);
      expect(table.rows[0].cells[1].text).toBe("Year ended Dec. 31,");
      expect(table.rows[0].cells[1].colspan).toBe(3);

      // Second header row - all cells present, no colspan
      expect(table.rows[1].isHeader).toBe(true);
      expect(table.rows[1].cells.every((c) => c.colspan === 1)).toBe(true);

      // Data row - not a header, no colspan extension
      expect(table.rows[2].isHeader).toBe(false);
    });

    it("should not extend colspan for non-header rows with fewer cells", () => {
      const tsv = "A\tB\tC\tD\n1\t2";
      const table = parseTsv(tsv);

      expect(table.columnCount).toBe(4);
      expect(table.rows[1].cells[1].colspan).toBe(1);
    });

    it("should extend last non-empty cell when trailing cells are empty", () => {
      const tsv = `[thead]A\tB\t\nC\tD\tE\tF`;
      const table = parseTsv(tsv);

      expect(table.columnCount).toBe(4);
      // Last non-empty cell "B" should span remaining columns (absorbing empty trailing cell)
      expect(table.rows[0].cells.length).toBe(2);
      expect(table.rows[0].cells[1].text).toBe("B");
      expect(table.rows[0].cells[1].colspan).toBe(3);
    });

    it("should handle single column tables", () => {
      const tsv = "[thead]Header\nRow1\nRow2";
      const table = parseTsv(tsv);

      expect(table.columnCount).toBe(1);
      expect(table.rows[0].cells[0].colspan).toBe(1);
    });
  });

  describe("toTsv", () => {
    it("should convert table back to TSV", () => {
      const tsv = "[thead]A\tB\n1\t2";
      const table = parseTsv(tsv);
      const result = toTsv(table);

      expect(result).toBe("[thead]A\tB\n1\t2");
    });

    it("should expand colspan cells to empty trailing cells", () => {
      const table = {
        rows: [
          {
            isHeader: true,
            cells: [
              { text: "", colspan: 1, isHeader: true },
              { text: "Spans three", colspan: 3, isHeader: true },
            ],
          },
        ],
        columnCount: 4,
      };

      const result = toTsv(table);
      expect(result).toBe("[thead]\tSpans three\t\t");
    });
  });
});
