# Changelog

All notable changes to dpdp-notice-lint. Dates are UTC. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] - 2026-11-14

Catalogue `2026-11-14`: the wording is owner-reviewed and the draft label is gone.

### Changed

- N8: a notice offered in English alone is now **found**. S.5(3) gives the option to access the
  notice in English or any Eighth Schedule language, so English satisfies it; a language named
  without an offer to read the notice in it stays unclear.
- N5: the fix step says the Board has not yet published its complaint channel and to add the
  link once it does. The check itself is unchanged.
- N9: stays in the linter as information, never counted; the caveat says so.
- The three `[OWNER]` markers are resolved, and a test now fails if one reappears.

## [0.1.0] - 2026-11-14

First release. Catalogue `2026-11-14-draft1`.

### Added

- Ten deterministic checks of a privacy notice's text against Section 5 of the DPDP Act, 2023
  and Rule 3 of the DPDP Rules, 2025: itemised personal data (N1), purposes and what they
  enable (N2), how to withdraw consent (N3), rights and the means (N4), complaining to the
  Data Protection Board (N5), dependence on another document (N6), plain-language signals
  (N7), the English or Eighth Schedule language option (N8), grievance contact and period
  (N9), consent bundled into use (N10). Each answers found, not found or unclear with the
  evidence it matched; never a score.
- A catalogue carrying every word a reader sees: titles, status wording, fix steps, certainty
  labels and verbatim provision extracts, versioned by `CATALOGUE_VERSION`.
- `lintNotice()` for Node and the browser, HTML stripping, a text and a JSON report.
- A CLI: file, stdin or a built-in sample; `--json`; `--fail-on not-found|unclear` over the
  required elements only.
- Tests: fixtures for every branch of every check, catalogue rules (no numbers, no score words,
  every cite resolves), the CLI, and the legal-accuracy gate shared with StateCheck's other
  DPDPA material.

### Known limits

- English text only.
- The legal wording is a draft awaiting owner review; `[OWNER]` marks the open questions.
