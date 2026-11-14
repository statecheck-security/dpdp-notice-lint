# dpdp-notice-lint

Checks a privacy notice's text against **Section 5** of India's Digital Personal Data Protection
Act, 2023 and **Rule 3** of the DPDP Rules, 2025. For each required element it says **found**,
**not found** or **unclear**, quotes the text it matched, and names the provision. A TypeScript
library with no dependencies, a CLI, and the engine behind the free
[DPDPA Notice Check](https://statechecksecurity.com/dpdpa/notice-check) on statechecksecurity.com.

**Status:** v0.1.0, catalogue `2026-11-14-draft1`. Ten checks, English notices only. The legal
wording is a first draft from the notified texts and is under owner review; open questions are
marked `[OWNER]` in the catalogue. See [CHANGELOG.md](CHANGELOG.md).

> **Not legal advice.** The linter reports what it found in the text you gave it and which
> provision each element rests on. It gives no score and no compliance verdict. "Not found"
> means the linter did not find it, not that it does not exist.

## Why

Every DPDPA tool on the market generates a notice. None checks one. Rule 3 is a short list of
required elements, and Section 5(1) adds three more, so a rule set over the text can test each
one honestly, with "not found" and "unclear" as answers. Generated a notice? This tells you
whether it says what Rule 3 asks for.

## What it checks

| Id  | What the linter looks for                                                                             | Provision                   | Certainty |
| --- | ----------------------------------------------------------------------------------------------------- | --------------------------- | --------- |
| N1  | An itemised list of personal data (name, email address, phone number…), not "information you provide" | Rule 3(b)(i), S.5(1)(i)     | settled   |
| N2  | Specific purposes, with the service or use each enables; not "for business purposes"                  | Rule 3(b)(ii), S.5(1)(i)    | settled   |
| N3  | How to withdraw consent, with a link or other means                                                   | Rule 3(c)(i), S.6(4)        | settled   |
| N4  | The rights (access, correction, erasure, nomination, grievance) and how to exercise them              | Rule 3(c)(ii), S.5(1)(ii)   | settled   |
| N5  | How to complain to the Data Protection Board, with a link or other means                              | Rule 3(c)(iii), S.5(1)(iii) | settled   |
| N6  | Sentences that send the reader to another document for a required element                             | Rule 3(a)                   | likely    |
| N7  | Plain-language signals: long sentences, passive voice, defined terms (information only)               | Rule 3(b)                   | open      |
| N8  | The option to read the notice in English or an Eighth Schedule language                               | S.5(3)                      | likely    |
| N9  | A grievance contact and a response period (information only)                                          | S.8(9), Rule 9, Rule 14(3)  | likely    |
| N10 | Consent bundled into use of the service ("by using the site you agree")                               | S.6(1)                      | likely    |

N1–N5 and N8 are **required elements**: "found" is what the Rule asks for. N6 and N10 are
**points to review**: "found" is a sentence to look at. N7 and N9 are **information**: they are
reported, never counted, and `--fail-on` ignores them.

Every word a reader sees (titles, what each status means, the fix steps, the verbatim provision
extracts) lives in [`src/catalogue/`](src/catalogue/), versioned by `CATALOGUE_VERSION`. The
engine emits ids, a status and evidence only. A test applies StateCheck's legal-accuracy rules to
every catalogue string, both reports, the CLI help and this README.

## Use

```bash
npx dpdp-notice-lint notice.txt            # text or HTML
npx dpdp-notice-lint - < notice.html       # stdin
npx dpdp-notice-lint --sample bad          # a built-in synthetic notice with the common misses
npx dpdp-notice-lint notice.txt --json     # the result with the catalogue wording attached
npx dpdp-notice-lint notice.txt --fail-on not-found   # exit 1 if a required element is not found
```

As a library (no dependencies, runs in Node 20+ and in the browser):

```ts
import { lintNotice, CHECKS, STATUS_TEXT } from 'dpdp-notice-lint';

const result = lintNotice(noticeText);
for (const r of result.results) {
  const check = CHECKS.find((c) => c.id === r.id)!;
  console.log(r.id, STATUS_TEXT[r.status].label, check.title);
  for (const e of r.evidence) console.log('  >', e.quote);
}
```

`lintNotice` is a pure function: the same text always gives the same result, nothing is stored,
no request is made. HTML is stripped to text with headings and list items kept as lines.

## How a check works

The text is split into headings, list items and sentences (a sentence ends at punctuation
followed by whitespace, so `example.in` never splits). Each check is a set of phrase lists and a
structure rule. N1, for example, is "found" when at least three distinct personal data items are
named and at least one sits in a list item or an enumerating sentence ("such as", "including", a
colon); "unclear" when items are named but scattered or too few; "not found" when none is named,
quoting any catch-all phrase it found instead. The rules are in [`src/lint.ts`](src/lint.ts) and
every branch has a fixture in [`test/lint.test.ts`](test/lint.test.ts).

Under thirty words, the review and information checks answer "unclear" rather than guess.

## What it does not do

- Read languages other than English. Hindi and the other Eighth Schedule languages wait on the
  Gazette texts, as in our other tools.
- Tell whether each item of personal data is tied to its purpose, or whether withdrawing is as
  easy as giving consent. It checks that both are stated.
- Fetch a URL, parse a PDF, or look at the consent screen. Paste or pipe the words.
- Give a score, a grade or a "compliant" verdict. The catalogue test fails if such a word
  appears.

## Development

```bash
npm ci
npm run lint          # tsc + eslint
npm test              # vitest: engine fixtures, catalogue rules, CLI, legal accuracy
npm run build         # dist/
npm run cli -- --sample good
```

Changing any catalogue string: bump `CATALOGUE_VERSION` in `src/catalogue/checks.ts`. Text that
cites a section or Rule is checked against the notified texts before merging; see
[CONTRIBUTING.md](CONTRIBUTING.md).

## Related

- [dpdp-scan](https://github.com/statecheck-security/dpdp-scan): finds Indian personal data in
  code, schemas and logs.
- [dpdpa-engineering-kit](https://github.com/statecheck-security/dpdpa-engineering-kit): tested
  code for consent, breach notification, encryption and residency.
- [DPDPA Website Check](https://statechecksecurity.com/scan): what a public site does before a
  visitor makes a choice.
- [DPDP Gap Identifier](https://statechecksecurity.com/dpdpa/gap-identifier): which obligation
  areas to fix first.

## Licence

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
