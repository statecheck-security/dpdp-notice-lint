import { CERTAINTY, CHECKS, NOT_CHECKED, PROVISIONS, RESULT_CAVEATS, STATUS_TEXT } from './catalogue/index.js';
import type { CheckDef, CheckKind, ProvisionCite, Status } from './catalogue/index.js';
import type { CheckResult, LintResult } from './lint.js';

/**
 * Renderers for a lint result. The text report is what the CLI prints; the JSON report is the
 * result joined with the catalogue wording each consumer needs, so a reader of the file sees the
 * same words as a reader of the terminal.
 */

const KIND_HEADINGS: Record<CheckKind, string> = {
  element: 'Required elements (Section 5 and Rule 3)',
  review: 'Points to review',
  information: 'Information',
};

/** Whether a result deserves the fix steps: anything but a clean "present" or a clean "no concern". */
export function needsFix(check: CheckDef<ProvisionCite>, status: Status): boolean {
  if (status === 'unclear') return true;
  return check.foundMeans === 'present' ? status === 'not_found' : status === 'found';
}

function card(check: CheckDef<ProvisionCite>, result: CheckResult): string[] {
  const lines = [
    `${check.id}  ${STATUS_TEXT[result.status].label}  ${check.title}`,
    `    ${check.statusText[result.status]}`,
  ];
  for (const e of result.evidence) lines.push(`    > ${e.quote}`);
  lines.push(`    Provisions: ${check.provisions.map((cite) => PROVISIONS[cite].cite).join(', ')}`);
  lines.push(`    Certainty: ${CERTAINTY[check.certainty].label.toLowerCase()}`);
  if (check.caveat) lines.push(`    Note: ${check.caveat}`);
  if (needsFix(check, result.status)) {
    lines.push('    Fix:');
    check.fix.forEach((step, i) => lines.push(`      ${i + 1}. ${step}`));
  }
  return lines;
}

/** The terminal report: caveats, then the checks by kind, then what was not checked. */
export function formatText(result: LintResult): string {
  const out: string[] = [`dpdp-notice-lint (catalogue ${result.catalogueVersion})`, ''];
  for (const caveat of RESULT_CAVEATS) out.push(`* ${caveat}`);
  out.push('');
  for (const kind of ['element', 'review', 'information'] as CheckKind[]) {
    out.push(KIND_HEADINGS[kind], '');
    for (const check of CHECKS.filter((c) => c.kind === kind)) {
      const r = result.results.find((x) => x.id === check.id);
      if (!r) continue;
      out.push(...card(check, r), '');
    }
  }
  out.push('What this does not check', '');
  for (const item of NOT_CHECKED) out.push(`* ${item}`);
  return out.join('\n');
}

/** The JSON report: the result, with each check's catalogue wording attached. */
export function formatJson(result: LintResult): string {
  const checks = result.results.map((r) => {
    const check = CHECKS.find((c) => c.id === r.id);
    if (!check) return r;
    return {
      id: r.id,
      title: check.title,
      kind: check.kind,
      status: r.status,
      statusLabel: STATUS_TEXT[r.status].label,
      statusText: check.statusText[r.status],
      evidence: r.evidence,
      provisions: check.provisions.map((cite) => PROVISIONS[cite]),
      certainty: check.certainty,
      caveat: check.caveat,
      fix: needsFix(check, r.status) ? check.fix : [],
    };
  });
  return JSON.stringify(
    {
      tool: 'dpdp-notice-lint',
      catalogueVersion: result.catalogueVersion,
      wordCount: result.wordCount,
      caveats: RESULT_CAVEATS,
      notChecked: NOT_CHECKED,
      checks,
    },
    null,
    2,
  );
}
