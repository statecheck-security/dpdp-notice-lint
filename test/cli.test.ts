import { describe, expect, it } from 'vitest';
import { SAMPLE_BAD, SAMPLE_GOOD } from '../src/catalogue/index.js';
import { fails, main, parseArgs } from '../src/cli.js';
import { lintNotice } from '../src/lint.js';
import { formatJson, formatText } from '../src/report.js';

function run(argv: string[], stdin = '') {
  let out = '';
  let err = '';
  const code = main(argv, { out: (s) => (out += s), err: (s) => (err += s), stdin: () => stdin });
  return { code, out, err };
}

describe('cli: arguments', () => {
  it('parses a file, stdin, a sample and the flags', () => {
    expect(parseArgs(['notice.txt']).source).toEqual({ kind: 'file', path: 'notice.txt' });
    expect(parseArgs(['-']).source).toEqual({ kind: 'stdin' });
    expect(parseArgs(['--sample', 'bad', '--json', '--fail-on', 'unclear'])).toMatchObject({
      source: { kind: 'sample', which: 'bad' },
      json: true,
      failOn: 'unclear',
    });
  });

  it('rejects unknown options and bad values with exit 2 and the usage', () => {
    expect(run(['--nope']).code).toBe(2);
    expect(run(['--fail-on', 'always']).err).toMatch(/not-found or unclear/);
    expect(run(['--sample', 'ugly']).err).toMatch(/good or bad/);
    const none = run([]);
    expect(none.code).toBe(2);
    expect(none.err).toMatch(/Usage:/);
  });

  it('prints help and version', () => {
    expect(run(['--help'])).toMatchObject({ code: 0 });
    expect(run(['--help']).out).toMatch(/not legal advice/);
    expect(run(['-v']).out).toMatch(/^\d+\.\d+\.\d+\n$/);
  });
});

describe('cli: reports', () => {
  it('lints stdin and prints the text report with every check', () => {
    const { code, out } = run(['-'], SAMPLE_GOOD);
    expect(code).toBe(0);
    for (let i = 1; i <= 10; i += 1) expect(out).toMatch(new RegExp(`^N${i}  `, 'm'));
    expect(out).toMatch(/Required elements \(Section 5 and Rule 3\)/);
    expect(out).toMatch(/not legal advice/);
  });

  it('prints JSON with the catalogue wording attached', () => {
    const { out } = run(['--sample', 'bad', '--json']);
    const parsed = JSON.parse(out) as {
      tool: string;
      checks: Array<{ id: string; status: string; fix: string[]; title: string }>;
    };
    expect(parsed.tool).toBe('dpdp-notice-lint');
    expect(parsed.checks).toHaveLength(10);
    const n1 = parsed.checks.find((c) => c.id === 'N1');
    expect(n1?.status).toBe('not_found');
    expect(typeof n1?.title).toBe('string');
    expect(n1?.fix.length).toBeGreaterThan(0);
    expect(out).toBe(`${formatJson(lintNotice(SAMPLE_BAD))}\n`);
  });

  it('the text report shows fix steps only where the result calls for them', () => {
    const good = formatText(lintNotice(SAMPLE_GOOD));
    const bad = formatText(lintNotice(SAMPLE_BAD));
    expect((good.match(/^ {4}Fix:/gm) ?? []).length).toBeLessThan((bad.match(/^ {4}Fix:/gm) ?? []).length);
  });

  it('reads a missing file as exit 2, not a crash', () => {
    const { code, err } = run(['./does-not-exist.txt']);
    expect(code).toBe(2);
    expect(err).toMatch(/could not read the notice/);
  });
});

describe('cli: --fail-on', () => {
  it('fails on not-found elements, never on review or information items', () => {
    expect(run(['--sample', 'bad', '--fail-on', 'not-found']).code).toBe(1);
    expect(run(['--sample', 'good', '--fail-on', 'unclear']).code).toBe(0);
    const onlyReview = new Map([
      ['N6', 'found'],
      ['N10', 'found'],
      ['N7', 'unclear'],
    ]);
    expect(fails(onlyReview, 'unclear')).toBe(false);
    expect(fails(new Map([['N3', 'unclear']]), 'not-found')).toBe(false);
    expect(fails(new Map([['N3', 'unclear']]), 'unclear')).toBe(true);
  });
});
