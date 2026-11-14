# Contributing to dpdp-notice-lint

Thank you. This is a small, deterministic tool, and the rules below keep it honest.

## Principles

1. **No verdict.** A check answers found, not found or unclear, with the evidence. No score, no
   grade, no "compliant". The catalogue test fails on those words.
2. **Words live in the catalogue.** The engine (`src/lint.ts`) emits check ids, a status and
   evidence. Every sentence a reader sees is in `src/catalogue/`, so legal wording is reviewed in
   one place. Bump `CATALOGUE_VERSION` on any change to a string, label or cite.
3. **Legal wording is reviewed, not improvised.** Any text that cites a section of the Act or a
   Rule is checked against the notified texts. State the exact provision (`S.5(1)(i)`,
   `Rule 3(c)(ii)`), never a paraphrase of what the law "requires". `test/legal.test.ts` applies
   StateCheck's legal-accuracy rules to every string; a maintainer runs the full check before
   merging, so expect wording changes. Where a point is open, mark it `[OWNER: …]` rather than
   guess.
4. **Every branch has a fixture.** A change to a check comes with a synthetic notice that shows
   the new behaviour in `test/lint.test.ts`, and the existing fixtures still pass.
5. **Synthetic notices only.** Never commit a real company's notice, even a public one. Write a
   short synthetic one that shows the pattern.
6. **No dependencies.** The package has none at runtime and runs in the browser. Keep it so.

## Setup

```bash
git clone https://github.com/statecheck-security/dpdp-notice-lint.git
cd dpdp-notice-lint
npm ci
npm run lint && npm test
```

## Pull requests

- One change per PR, with the fixture that shows it.
- Sign off your commits (`git commit -s`) to certify the
  [Developer Certificate of Origin](https://developercertificate.org/).
- If you changed a catalogue string, say in the PR which provision it rests on and bump
  `CATALOGUE_VERSION`.
- Hindi and other Eighth Schedule languages: not yet. The phrase lists wait on the Gazette texts.
  Open an issue first if you want to start on them.
