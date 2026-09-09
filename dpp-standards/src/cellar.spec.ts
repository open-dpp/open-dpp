import { describe, expect, it } from "vitest";
import { newRows, parseSparqlJson, toMarkdown } from "./cellar";
import { newRunId } from "./run-id";

const answer = {
  results: {
    bindings: [
      {
        celex: { value: "32026R1778" },
        date: { value: "2026-07-16" },
        title: { value: "Commission Implementing Regulation (EU)  2026/1778\n of 16 July 2026" },
      },
      {
        celex: { value: "32027R0001" },
        date: { value: "2027-01-05T00:00:00" },
        title: { value: "Commission Delegated Regulation (EU) 2027/1" },
      },
    ],
  },
};

describe("cellar", () => {
  it("parses SPARQL JSON into rows with normalised titles and dates", () => {
    expect(parseSparqlJson(answer)).toEqual([
      {
        celex: "32026R1778",
        date: "2026-07-16",
        title: "Commission Implementing Regulation (EU) 2026/1778 of 16 July 2026",
      },
      {
        celex: "32027R0001",
        date: "2027-01-05",
        title: "Commission Delegated Regulation (EU) 2027/1",
      },
    ]);
    expect(() => parseSparqlJson({ results: {} })).toThrow();
  });

  it("reports only the acts the state has not seen, as a Markdown table", () => {
    const rows = parseSparqlJson(answer);
    const fresh = newRows([{ celex: "32026R1778" }], rows);
    expect(fresh.map((r) => r.celex)).toEqual(["32027R0001"]);
    expect(toMarkdown(fresh)).toContain(
      "| [32027R0001](http://publications.europa.eu/resource/celex/32027R0001) | 2027-01-05 |",
    );
    expect(toMarkdown([])).toBe("No act newer than the watch state.\n");
  });
});

describe("newRunId", () => {
  it("names the scope and suffixes collisions", () => {
    const text = { kind: "text" as const, sources: ["EN18219", "GS1DL"] };
    expect(newRunId("2026-09-20", text, [])).toBe("2026-09-20-en18219+gs1dl");
    expect(newRunId("2026-09-20", text, ["2026-09-20-en18219+gs1dl"])).toBe(
      "2026-09-20-en18219+gs1dl-2",
    );
    expect(newRunId("2026-09-20", { kind: "code", commit: "abc" }, [])).toBe("2026-09-20-all");
    expect(newRunId("2026-09-20", { kind: "check", checkIds: ["x"] }, [])).toBe("2026-09-20-check");
  });
});
