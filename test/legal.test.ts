/**
 * Legal-accuracy gate. Applies the statecheck-docs `social-legal-check` rules (vendored in
 * scripts/legalRules.mjs) to every string a user can read: the catalogue, the samples, both
 * rendered reports, the CLI help, the README and the changelog. Fails on any violation, and on
 * drift from the upstream rules when a statecheck-docs checkout sits beside this repo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { RULES } from '../scripts/legalRules.mjs';
import {
  CERTAINTY,
  CHECKS,
  NOT_CHECKED,
  PROVISIONS,
  RESULT_CAVEATS,
  SAMPLE_BAD,
  SAMPLE_GOOD,
  STATUS_TEXT,
} from '../src/catalogue/index.js';
import { main } from '../src/cli.js';
import { lintNotice } from '../src/lint.js';
import { formatJson, formatText } from '../src/report.js';

interface Rule {
  pattern: RegExp;
  unless?: RegExp;
  message: string;
}
interface Source {
  label: string;
  text: string;
}

const rules = RULES as Rule[];

function collect(label: string, value: unknown, out: Source[]): void {
  if (typeof value === 'string') out.push({ label, text: value });
  else if (Array.isArray(value)) value.forEach((v, i) => collect(`${label}[${i}]`, v, out));
  else if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value)) collect(`${label}.${key}`, v, out);
  }
}

function violations(sources: Source[]): string[] {
  const out: string[] = [];
  for (const { label, text } of sources) {
    for (const line of text.split('\n')) {
      for (const rule of rules) {
        if (rule.pattern.test(line) && !(rule.unless && rule.unless.test(line))) {
          out.push(`${label}: "${line.trim()}"\n  ${rule.message}`);
        }
      }
    }
  }
  return out;
}

function help(): string {
  let out = '';
  main(['--help'], { out: (s) => (out += s), err: () => undefined, stdin: () => '' });
  return out;
}

const ROOT = new URL('../', import.meta.url);

describe('legal accuracy', () => {
  it('every string a user can read passes the vendored rules', () => {
    const sources: Source[] = [];
    collect('checks', CHECKS, sources);
    collect('provisions', PROVISIONS, sources);
    collect('certainty', CERTAINTY, sources);
    collect('status', STATUS_TEXT, sources);
    collect('caveats', RESULT_CAVEATS, sources);
    collect('notChecked', NOT_CHECKED, sources);
    sources.push({ label: 'sample.good', text: SAMPLE_GOOD }, { label: 'sample.bad', text: SAMPLE_BAD });
    for (const [name, sample] of [
      ['good', SAMPLE_GOOD],
      ['bad', SAMPLE_BAD],
      ['empty', ''],
    ] as const) {
      sources.push({ label: `report.text(${name})`, text: formatText(lintNotice(sample)) });
      sources.push({ label: `report.json(${name})`, text: formatJson(lintNotice(sample)) });
    }
    sources.push({ label: 'cli.help', text: help() });
    for (const file of ['README.md', 'CHANGELOG.md', 'SECURITY.md', 'CONTRIBUTING.md', 'NOTICE']) {
      sources.push({ label: file, text: fs.readFileSync(new URL(file, ROOT), 'utf-8') });
    }
    expect(violations(sources)).toEqual([]);
  });

  it('the vendored rules match statecheck-docs when it is checked out beside this repo', () => {
    const upstream = path.resolve(
      process.env.STATECHECK_DOCS_PATH ?? path.join(process.cwd(), '..', 'statecheck-docs'),
      '.claude/skills/social-legal-check/check.mjs',
    );
    if (!fs.existsSync(upstream)) return;
    const block = /^const RULES = \[[\s\S]*?\n\];/m;
    const normalise = (s: string) => s.replace(/\r\n/g, '\n').trim();
    const theirs = fs.readFileSync(upstream, 'utf-8').match(block)?.[0];
    const ours = fs
      .readFileSync(new URL('scripts/legalRules.mjs', ROOT), 'utf-8')
      .replace(/^export const RULES/m, 'const RULES')
      .match(block)?.[0];
    expect(theirs && ours && normalise(theirs) === normalise(ours), 'copy the RULES block from statecheck-docs').toBe(
      true,
    );
  });
});
