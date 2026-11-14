# Notice Linter (T6) — Implementation Plan

> Moved here from the StateCheck site repo on 2026-11-14 when the engine and catalogue became this package (`dpdp-notice-lint`, npm, Apache-2.0). Paths below that start `src/lib/` or `src/data/` were the site's; in this repo the engine is `src/lint.ts` and the catalogue `src/catalogue/`. The website page (`/dpdpa/notice-check`) and the integrations stay in the site repo and import this package.

> Checks an existing privacy notice against Section 5 of the Act and Rule 3 of the Rules, and says what is missing. A free web tool at `/dpdpa/notice-check` and a function the Website Check (W12–W16) and the Gap Identifier can call.
> Written: 2026-11-07 | Status: v1 built 2026-11-14 (branch claude/pensive-swirles-493a58, PR open; owner review of the catalogue outstanding) | Priority 1 of the five (smallest build, no competitor)

> **Build notes (2026-11-14).** Paths differ from the ones below, by the owner's brief: catalogue in `src/data/noticeLinter/` (types, provisions, checks, samples), engine in one file `src/lib/noticeLinter.ts` (phrase lists live beside each check, not in a separate `phrases.ts`), page at `src/pages/dpdpa/notice-check.astro` with its script in `src/scripts/noticeCheck.ts`. v1 is paste only and runs entirely in the browser: no `api/notice-fetch.ts`, no URL mode, no email gate, nothing stored. The catalogue is `2026-11-14-draft1`; open wording questions are marked `[OWNER]` in the copy (N5 Board channel, N8 English-only, N9 placement). Wired into `npm run check:legal` and the sitemap lastmod. No share card yet (falls back to the site default).

---

## Why build it

- **Nobody checks notices; everybody generates them.** The October research (statecheck-docs `docs/strategy/dpdpa-competitor-research.md`, T6) found PriView (DSCI × IDfy), dpdpa.com, CyberSigma and others all _generate_ a notice; none _validates_ one against Rule 3. The November research confirmed it: the only notice analysers on GitHub are LLM scorers of policy text, none deterministic, none against S.5 / Rule 3.
- **It positions against the generators**: "you generated a notice; does it meet Rule 3?" PriView's DSCI backing makes it the one to name in comparisons.
- **It strengthens two tools we already have.** dpdp-webscan reads policy pages (W12–W16) but checks presence, not content; the Gap Identifier's notice gap recommends steps but cannot look at the notice. Both get a deterministic content check from this.
- **The law is checkable.** Rule 3 is a short list of required elements; S.5(1) three more; S.5(3) a language option. A rule set over text can test each one honestly, with "not found" and "unclear" as answers, never a score.

## What the law requires (the rule set, from the notified texts)

Section 5(1): the notice must inform the Data Principal of (i) the personal data and the purpose for which it is proposed to be processed; (ii) the manner in which she may exercise her rights under S.6(4) and S.13; (iii) the manner in which she may make a complaint to the Board. S.5(3): the option to access the notice in English or any language in the Eighth Schedule.

Rule 3: the notice shall (a) be presented and be understandable independently of any other information; (b) give, in clear and plain language, a fair account including at the minimum (i) an itemised description of such personal data and (ii) the specified purpose or purposes, and a specific description of the goods, services or uses enabled; (c) give the particular communication link for the website or app, and a description of other means, by which she may (i) withdraw consent with ease comparable to giving it, (ii) exercise her rights under the Act, (iii) make a complaint to the Board.

Checks derived, each with an id, a certainty label (settled / likely / open, the same scheme as the Website Check) and the provision:

| Id  | What the linter looks for                                                           | Provision                           | Certainty                                              |
| --- | ----------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------ |
| N1  | An itemised list of personal data categories (not "information you provide")        | Rule 3(b)(i)                        | settled                                                |
| N2  | Purposes stated per category or per processing, with the service or use they enable | Rule 3(b)(ii), S.5(1)(i)            | settled                                                |
| N3  | A way to withdraw consent, described, with a link                                   | Rule 3(c)(i), S.6(4)                | settled                                                |
| N4  | How to exercise rights (access, correction, erasure, nomination, grievance)         | Rule 3(c)(ii), S.5(1)(ii)           | settled                                                |
| N5  | How to complain to the Board, with the link or means                                | Rule 3(c)(iii), S.5(1)(iii)         | settled                                                |
| N6  | The notice stands alone: not "see our terms" for any required element               | Rule 3(a)                           | likely (judgement)                                     |
| N7  | Plain-language signals: sentence length, passive density, defined-term dependence   | Rule 3(b) "clear and plain"         | open (heuristic, reported as information)              |
| N8  | Language option: the notice offers English or an Eighth Schedule language           | S.5(3)                              | likely                                                 |
| N9  | Grievance contact and period present (the notice is where most companies put them)  | S.8(9), Rule 9; S.8(10), Rule 14(3) | likely (not a Rule 3 element; reported as information) |
| N10 | Bundled consent language ("by using the site you agree") inside the notice          | S.6(1) free, specific, informed     | likely                                                 |

Everything the reader sees comes from a catalogue in `src/data/noticeCheck/` (same discipline as `src/data/scan/`): ids and evidence from the engine, words from the catalogue, `CATALOGUE_VERSION` bumped on any change, and `npm run check:legal` over every string.

## Scope

**v1:**

1. **Engine** (`src/lib/noticeCheck/`, TypeScript, pure functions): input is notice text (plain or HTML stripped), output is findings `{id, status: found | not_found | unclear, evidence: [{quote, offset}]}`. Deterministic: keyword and structure rules per check, with per-check positive and negative phrase lists, and section detection (headings, lists). No LLM.
2. **Catalogue** `src/data/noticeCheck/`: titles, what the Rule says, what good looks like, a fix per check, certainty labels, provisions. Drafted and claim-checked in statecheck-docs first.
3. **Page** `/dpdpa/notice-check`: paste text or a URL (fetched server-side through the same SSRF guard the Website Check uses: public hosts only, max size, no redirects to private ranges). Result rendered in place, no account, nothing stored; the notice text is not logged (our own DPDPA hygiene, same as `/scan`).
4. **Integration**: Website Check W12–W16 call the engine on the policy page it already fetched and attach N-findings as information items; the Gap Identifier's notice gap links to the page.
5. **Fixtures**: synthetic notices, good and bad, one per check, plus three real-world-shaped ones written by us. No copied third-party notices in the repo.

**Not in v1:** Hindi or other Eighth Schedule languages (blocked on the Gazette Hindi text, same as webscan); PDF notices; app-store notice fetching; any score or "compliant" verdict; generating a notice (the generators exist; ours is the checker).

## Ground rules

- **No verdict.** "Not found" means the linter did not find it, and the page says so. A notice that fails N1 may still be lawful if the itemisation is elsewhere; the output says "we checked this text only".
- **Legal wording** only from the catalogue, claim-checked in statecheck-docs, legal check in CI.
- **Nothing stored.** The pasted or fetched notice is processed in the request and discarded. No analytics on the text.
- **Honest heuristics.** N7 and N10 are flagged `open` and shown as information, never as findings that count.

## Stack

scs itself: Astro page, TypeScript engine under `src/lib/`, Vitest tests, the existing SSRF guard pattern from `dpdp-webscan` ported to a server route `src/pages/api/notice-fetch.ts` with the Upstash rate limiter already in the repo. No new dependencies.

---

## Tasks

### NL-1 · Catalogue draft · ~0.5 d (statecheck-docs first)

- [ ] `output/dpdpa-hub/guide/notice-check.claims.md`: each check's wording, the Rule text it rests on, certainty, fix _(2026-11-14: first draft written straight into `src/catalogue/checks.ts` as catalogue `2026-11-14-draft1`; the claims file and owner read are still open, `[OWNER]` marks the open points)_ (the scs catalogue holds the draft wording; copy it across for the claim check)
- [ ] Legal check clean; owner reads it
- **Done when:** the ten checks have reviewed wording and provisions.

### NL-2 · Engine · ~1 d

- [x] `src/lib/noticeLinter.ts` (one file: normalise, segment, checks, entry point); HTML to text with headings and lists kept as structure
- [x] Per-check phrase lists (English) beside each check in the engine; negative lists ("information you provide" is not itemisation, "for business purposes" is not a purpose)
- [x] Tests: `src/lib/noticeLinter.test.ts` (good and bad sample, empty text, the common misses, per-check edges, determinism, offsets) and `noticeLinterCatalogue.test.ts` (ids, cites resolve, no score, [OWNER] markers). No-logging guard is by construction: the engine has no I/O and the page script has no fetch or storage call
- **Done when:** every check has a passing positive and negative fixture, and the engine is pure (no I/O).

### NL-3 · Page and fetch route · ~0.5 d

- [x] `/dpdpa/notice-check` paste mode, results in place with JS; without JS the page lists the ten checks and the provisions to read by hand (no server render: nothing leaves the browser)
- [ ] URL mode (open decision 2: v1 is paste only)
- [ ] `api/notice-fetch.ts`: SSRF guard, 1 MB cap, 10 s timeout, rate limit, no retention (not built: v1 is paste only)
- [ ] Share card (`public/og/dpdpa-notice-check.png`, needs a render script like the service cards)
- [x] SEO: title, description, canonical, SoftwareApplication JSON-LD, sitemap lastmod from `PAGE_UPDATED` (`dpdpaStandards.test.ts` covers Markdown pages only, so it does not apply)
- **Done when:** a pasted synthetic bad notice shows ten results with the catalogue wording; a fetched good notice shows none missing. (Checked 2026-11-14 with the two samples: the bad one shows 6 of 6 elements not found, the good one 6 of 6 found.)

### NL-4 · Integrations · ~0.5 d

- [ ] Website Check: run N1–N5 over the privacy page it fetched; show as information under W12–W16, never as a failed check
- [ ] Gap Identifier: the notice gap's engineering steps link to the page
- [ ] `/dpdpa` hub: one sentence in "Find your gaps"
- **Done when:** `/scan/our-site` shows the notice items for our own policy and they are all found.

### NL-5 · Launch · ~0.5 d

- [ ] Blog post: "Does your privacy notice meet Rule 3? Ten checks" (statecheck-docs, legal check)
- [ ] LinkedIn post; newsletter mention; `npm run indexnow` for the new page
- [ ] Compare to PriView by name, fairly: it generates, we check

## Estimate

About **3 working days**. NL-2 and NL-3 can run in parallel after NL-1.

## Open decisions (yours)

1. Page slug: `/dpdpa/notice-check` (proposed) or under `/scan`.
2. Whether to accept URLs at all in v1, or paste only (URLs reuse the webscan guard; paste is zero risk).
3. Whether N9 (grievance contact and period) belongs here or stays with the Website Check's W14–W16.
