/**
 * A Check is one Playwright test with a stable id, tagged with the Criteria it evidences
 * (CONTEXT.md, "Conformance Review"). The reporter turns the annotation and tags into the Check
 * report that `dpp-standards` folds into the matrix. Decided in wayfinder ticket #755.
 */
import { expect, test as base } from "../fixtures";
import { CHECK_ANNOTATION } from "./annotation";

export { CHECK_ANNOTATION };

type Body = Parameters<typeof base>[2];

export type CheckSpec = {
  /** `<class>.<name>`, stable across runs: `resolver.redirect-published`. */
  id: string;
  title: string;
  /** Criterion ids of `dpp-standards/matrix/*.yaml`; unknown ids fail `matrix:fold`. */
  criteria: readonly string[];
};

export const check = ({ id, title, criteria }: CheckSpec, body: Body): void =>
  base(
    `${id}: ${title}`,
    {
      tag: criteria.map((c) => `@${c}`),
      annotation: [{ type: CHECK_ANNOTATION, description: id }],
    },
    body,
  );

export { expect };
