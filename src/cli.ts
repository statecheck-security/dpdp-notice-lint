#!/usr/bin/env node
/**
 * dpdp-notice-lint CLI. Reads a notice from a file, stdin or a built-in sample, runs the checks
 * and prints a text or JSON report. Makes no network request and writes nothing but the report.
 */
import { readFileSync } from 'node:fs';
import { CHECKS, SAMPLE_BAD, SAMPLE_GOOD } from './catalogue/index.js';
import { lintNotice } from './lint.js';
import { formatJson, formatText } from './report.js';

const VERSION = '0.1.0';

const USAGE = `dpdp-notice-lint ${VERSION}

Checks a privacy notice's text against Section 5 of India's DPDP Act, 2023 and Rule 3 of the
DPDP Rules, 2025. Says found, not found or unclear for each element. No score, no verdict,
not legal advice.

Usage:
  dpdp-notice-lint <file>              Lint a text or HTML file
  dpdp-notice-lint -                   Lint stdin
  dpdp-notice-lint --sample good|bad   Lint a built-in synthetic notice

Options:
  --json                 Print the result as JSON (with the catalogue wording attached)
  --fail-on <status>     Exit 1 if any required element has this status: not-found or unclear
                         (unclear also fails on not-found). A CI convenience, not a verdict.
  --version, -v          Print the version
  --help, -h             Print this help
`;

interface Options {
  source: { kind: 'file'; path: string } | { kind: 'stdin' } | { kind: 'sample'; which: 'good' | 'bad' } | null;
  json: boolean;
  failOn: 'not-found' | 'unclear' | null;
  help: boolean;
  version: boolean;
}

export function parseArgs(argv: string[]): Options {
  const options: Options = { source: null, json: false, failOn: null, help: false, version: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') options.json = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--version' || arg === '-v') options.version = true;
    else if (arg === '--fail-on') {
      const value = argv[i + 1];
      if (value !== 'not-found' && value !== 'unclear') throw new Error('--fail-on takes not-found or unclear');
      options.failOn = value;
      i += 1;
    } else if (arg === '--sample') {
      const value = argv[i + 1];
      if (value !== 'good' && value !== 'bad') throw new Error('--sample takes good or bad');
      options.source = { kind: 'sample', which: value };
      i += 1;
    } else if (arg === '-') options.source = { kind: 'stdin' };
    else if (arg?.startsWith('-')) throw new Error(`unknown option ${arg}`);
    else if (arg) options.source = { kind: 'file', path: arg };
  }
  return options;
}

/** Whether the result trips `--fail-on`. Required elements only; review and information never fail a build. */
export function fails(statuses: Map<string, string>, failOn: 'not-found' | 'unclear'): boolean {
  return CHECKS.filter((c) => c.kind === 'element').some((c) => {
    const status = statuses.get(c.id);
    return status === 'not_found' || (failOn === 'unclear' && status === 'unclear');
  });
}

export function main(
  argv: string[],
  io: { out: (s: string) => void; err: (s: string) => void; stdin: () => string },
): number {
  let options: Options;
  try {
    options = parseArgs(argv);
  } catch (e) {
    io.err(`${(e as Error).message}\n\n${USAGE}`);
    return 2;
  }
  if (options.help) {
    io.out(USAGE);
    return 0;
  }
  if (options.version) {
    io.out(`${VERSION}\n`);
    return 0;
  }
  if (!options.source) {
    io.err(USAGE);
    return 2;
  }
  let text: string;
  try {
    if (options.source.kind === 'sample') text = options.source.which === 'good' ? SAMPLE_GOOD : SAMPLE_BAD;
    else if (options.source.kind === 'stdin') text = io.stdin();
    else text = readFileSync(options.source.path, 'utf-8');
  } catch (e) {
    io.err(`could not read the notice: ${(e as Error).message}\n`);
    return 2;
  }
  const result = lintNotice(text);
  io.out(`${options.json ? formatJson(result) : formatText(result)}\n`);
  if (options.failOn && fails(new Map(result.results.map((r) => [r.id, r.status])), options.failOn)) return 1;
  return 0;
}

// Run only when invoked directly, so the tests can import `main` without side effects.
const invoked = process.argv[1] && /(?:^|[\\/])(?:cli\.(?:js|ts)|dpdp-notice-lint)$/.test(process.argv[1]);
if (invoked) {
  const code = main(process.argv.slice(2), {
    out: (s) => process.stdout.write(s),
    err: (s) => process.stderr.write(s),
    stdin: () => readFileSync(0, 'utf-8'),
  });
  process.exitCode = code;
}
