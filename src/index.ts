/**
 * dpdp-notice-lint: deterministic checks of a privacy notice against Section 5 of India's
 * Digital Personal Data Protection Act, 2023 and Rule 3 of the DPDP Rules, 2025.
 *
 * `lintNotice(text)` returns one result per check: found, not found or unclear, with the
 * evidence it matched. The catalogue carries every word a reader sees. No score, no verdict.
 */
export {
  MIN_WORDS,
  countWords,
  lintNotice,
  looksLikeHtml,
  segment,
  toPlainText,
  type CheckResult,
  type Evidence,
  type LintResult,
  type Unit,
} from './lint.js';
export { formatJson, formatText } from './report.js';
export * from './catalogue/index.js';
