import { describe, expect, it } from 'vitest';
import {
  APPLIES_FROM,
  CATALOGUE_VERSION,
  CERTAINTY,
  CHECK_IDS,
  CHECKS,
  CHECKS_BY_ID,
  NOT_CHECKED,
  PROVISIONS,
  RESULT_CAVEATS,
  STATUS_TEXT,
  STATUSES,
} from '../src/catalogue/index.js';

/** Every string a visitor can read from the catalogue (provision extracts are verbatim law, so excluded). */
const CATALOGUE = { CHECKS, CERTAINTY, STATUS_TEXT, RESULT_CAVEATS, NOT_CHECKED };

function walk(value: unknown, visit: (key: string | null, v: unknown) => void, key: string | null = null): void {
  visit(key, value);
  if (Array.isArray(value)) value.forEach((v) => walk(v, visit));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walk(v, visit, k);
  }
}

function strings(value: unknown): string[] {
  const out: string[] = [];
  walk(value, (_, v) => {
    if (typeof v === 'string') out.push(v);
  });
  return out;
}

/** "S.6(1)", "Rule 14(1)(a)", "S.11": every cite written into a string. */
const CITE = /\b(?:S\.\d+|Rule \d+)(?:\([a-z0-9]+\))*/g;

/** A cite resolves to an exact key, a more specific key ("Rule 3" → "Rule 3(a)"), or a range key ("S.12" → "S.11–S.14"). */
function resolves(cite: string): boolean {
  return Object.keys(PROVISIONS).some((key) => {
    if (key === cite || key.startsWith(`${cite}(`)) return true;
    const range = /^S\.(\d+)–S\.(\d+)$/.exec(key);
    const section = /^S\.(\d+)$/.exec(cite);
    return !!range && !!section && Number(section[1]) >= Number(range[1]) && Number(section[1]) <= Number(range[2]);
  });
}

describe('notice linter catalogue: ids', () => {
  it('checks are exactly N1–N10, in order', () => {
    expect(CHECKS.map((c) => c.id)).toEqual([...CHECK_IDS]);
    expect(CHECK_IDS).toEqual(Array.from({ length: 10 }, (_, i) => `N${i + 1}`));
    for (const id of CHECK_IDS) expect(CHECKS_BY_ID[id]?.id).toBe(id);
  });

  it('CATALOGUE_VERSION is YYYY-MM-DD with an optional -draftN or -rN', () => {
    expect(CATALOGUE_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}(-draft\d+|-r\d+)?$/);
  });

  it('the plan’s kinds: N1–N5 and N8 are elements, N6 and N10 review, N7 and N9 information', () => {
    const kinds = Object.fromEntries(CHECKS.map((c) => [c.id, c.kind]));
    expect(kinds).toEqual({
      N1: 'element',
      N2: 'element',
      N3: 'element',
      N4: 'element',
      N5: 'element',
      N6: 'review',
      N7: 'information',
      N8: 'element',
      N9: 'information',
      N10: 'review',
    });
    for (const c of CHECKS) {
      if (c.kind === 'element') expect(c.foundMeans, c.id).toBe('present');
      if (c.kind === 'review') expect(c.foundMeans, c.id).toBe('concern');
    }
  });

  it('the plan’s certainty labels', () => {
    const labels = Object.fromEntries(CHECKS.map((c) => [c.id, c.certainty]));
    expect(labels).toEqual({
      N1: 'settled',
      N2: 'settled',
      N3: 'settled',
      N4: 'settled',
      N5: 'settled',
      N6: 'likely',
      N7: 'open',
      N8: 'likely',
      N9: 'likely',
      N10: 'likely',
    });
  });
});

describe('notice linter catalogue: provisions', () => {
  it('every key is its own cite and every extract is filled in', () => {
    for (const [key, p] of Object.entries(PROVISIONS)) {
      expect(p.cite).toBe(key);
      expect(p.heading.length).toBeGreaterThan(0);
      expect(p.text.length).toBeGreaterThan(0);
      expect(p.appliesFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it.each(CHECKS.map((c) => [c.id, c] as const))('%s cites known provisions that commence 13 May 2027', (_, check) => {
    expect(check.provisions.length).toBeGreaterThan(0);
    for (const cite of check.provisions) {
      expect(PROVISIONS[cite]?.appliesFrom).toBe(APPLIES_FROM);
    }
  });

  it('every cite written into a catalogue string is in PROVISIONS', () => {
    const cites = new Set(strings(CATALOGUE).flatMap((s) => s.match(CITE) ?? []));
    expect([...cites].filter((c) => !resolves(c))).toEqual([]);
  });

  it('the plan’s provisions per check', () => {
    expect(CHECKS_BY_ID.N1!.provisions).toContain('Rule 3(b)(i)');
    expect(CHECKS_BY_ID.N2!.provisions).toEqual(expect.arrayContaining(['Rule 3(b)(ii)', 'S.5(1)(i)']));
    expect(CHECKS_BY_ID.N3!.provisions).toEqual(expect.arrayContaining(['Rule 3(c)(i)', 'S.6(4)']));
    expect(CHECKS_BY_ID.N4!.provisions).toEqual(expect.arrayContaining(['Rule 3(c)(ii)', 'S.5(1)(ii)']));
    expect(CHECKS_BY_ID.N5!.provisions).toEqual(expect.arrayContaining(['Rule 3(c)(iii)', 'S.5(1)(iii)']));
    expect(CHECKS_BY_ID.N6!.provisions).toEqual(['Rule 3(a)']);
    expect(CHECKS_BY_ID.N7!.provisions).toEqual(['Rule 3(b)']);
    expect(CHECKS_BY_ID.N8!.provisions).toEqual(['S.5(3)']);
    expect(CHECKS_BY_ID.N9!.provisions).toEqual(expect.arrayContaining(['S.8(9)', 'Rule 9', 'S.8(10)', 'Rule 14(3)']));
    expect(CHECKS_BY_ID.N10!.provisions).toEqual(['S.6(1)']);
  });
});

describe('notice linter catalogue: labels and wording', () => {
  it.each(CHECKS.map((c) => [c.id, c] as const))(
    '%s has a label, every field, every status and a caveat unless settled',
    (_, check) => {
      expect(Object.keys(CERTAINTY)).toContain(check.certainty);
      expect(check.title.length).toBeGreaterThan(0);
      expect(check.looksFor.length).toBeGreaterThan(0);
      for (const s of STATUSES) expect(check.statusText[s].length, s).toBeGreaterThan(0);
      expect(check.fix.length).toBeGreaterThan(0);
      if (check.certainty !== 'settled') expect(check.caveat?.length ?? 0).toBeGreaterThan(0);
    },
  );

  it('every "not found" wording says what we did not find, never what the notice lacks', () => {
    for (const check of CHECKS) expect(check.statusText.not_found, check.id).toMatch(/^We did not find/);
    const claims = strings(CATALOGUE).filter((s) =>
      /\b(?:the notice has no|your notice (?:has no|lacks)|you (?:do not|don't) have|does not have)\b/i.test(s),
    );
    expect(claims).toEqual([]);
  });

  it('a result caveat says we checked this text only and that nothing leaves the browser', () => {
    expect(RESULT_CAVEATS.some((c) => c.includes('this text only'))).toBe(true);
    expect(RESULT_CAVEATS.some((c) => /stays in your browser/.test(c))).toBe(true);
    expect(RESULT_CAVEATS.some((c) => /not legal advice/.test(c))).toBe(true);
  });

  it('open legal wording questions are marked [OWNER], never guessed silently', () => {
    const owner = strings(CATALOGUE).filter((s) => s.includes('[OWNER'));
    expect(owner.length).toBeGreaterThan(0);
    for (const s of owner) expect(s).toMatch(/\[OWNER[^\]]*\]/);
  });
});

describe('notice linter catalogue: no score', () => {
  it('no key names a score, grade, severity, rating or percentage', () => {
    const keys: string[] = [];
    walk({ ...CATALOGUE, PROVISIONS }, (key) => {
      if (key && /score|grade|severity|rating|percent/i.test(key)) keys.push(key);
    });
    expect(keys).toEqual([]);
  });

  it('holds no numbers', () => {
    const numbers: unknown[] = [];
    walk({ ...CATALOGUE, PROVISIONS }, (_, v) => {
      if (typeof v === 'number') numbers.push(v);
    });
    expect(numbers).toEqual([]);
  });

  it('no string scores, grades or passes the notice', () => {
    const scored = strings(CATALOGUE).filter((s) =>
      /\b(?:score|grade|severity|rating|compliant|non-compliant|percent|pass|fail)\b|%/i.test(s),
    );
    expect(scored).toEqual([]);
  });
});
