/**
 * Shapes for the dpdp-notice-lint catalogue. Pure data, no runtime dependencies. The engine
 * (`src/lint.ts`) emits only check ids, a status and the evidence it matched; every word a
 * reader sees comes from here, so the legal-accuracy test (`test/legal.test.ts`) runs over it.
 *
 * No score, grade, severity or rating, and no numeric field: a result is a provision plus a
 * status (found, not found, unclear) and a certainty label, never a measure
 * (`test/catalogue.test.ts` enforces it).
 */

export const CHECK_IDS = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N9', 'N10'] as const;

export type CheckId = (typeof CHECK_IDS)[number];

/** What the engine says about one check. Never a verdict on the notice. */
export type Status = 'found' | 'not_found' | 'unclear';

export const STATUSES: readonly Status[] = ['found', 'not_found', 'unclear'];

/**
 * settled: the text expressly requires the element and the check looks for it directly.
 * likely: a reasonable reading that depends on a point the text does not settle.
 * open: arguable, or a heuristic; shown as information for the drafter, never as a finding.
 */
export type Certainty = 'settled' | 'likely' | 'open';

/**
 * element: a required element of the notice under S.5 or Rule 3.
 * review: a pattern that may undermine the notice; "found" is a point to review.
 * information: reported for the drafter; not a Rule 3 element.
 */
export type CheckKind = 'element' | 'review' | 'information';

/** Whether "found" is the thing the Rule wants (present) or a thing to look at (concern). */
export type FoundMeans = 'present' | 'concern';

export interface Provision {
  /** As printed, e.g. "S.5(1)(i)" or "Rule 3(b)(i)". */
  cite: string;
  source: 'act' | 'rules';
  /** Section or rule heading from the verified text. */
  heading: string;
  /** Short verbatim extract from statecheck-docs `docs/legal_context/`. */
  text: string;
  /** ISO date the provision commences. */
  appliesFrom: string;
}

export interface CheckDef<Cite extends string = string> {
  id: CheckId;
  /** Plain-language title: the element or pattern, not a verdict. */
  title: string;
  kind: CheckKind;
  foundMeans: FoundMeans;
  /** What the linter looks for in the text, in the visitor's words. */
  looksFor: string;
  /** What each status means for this check. "not_found" wording always starts "We did not find". */
  statusText: Record<Status, string>;
  /** Steps, in the order we would do them. */
  fix: string[];
  /** Keys into `PROVISIONS`, in the order they are shown. */
  provisions: Cite[];
  certainty: Certainty;
  /** Why the label is not "settled", or what the linter cannot see. */
  caveat?: string;
}

export interface CertaintyDef {
  label: string;
  meaning: string;
}

export interface StatusDef {
  label: string;
  meaning: string;
}
