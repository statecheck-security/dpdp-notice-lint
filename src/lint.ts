/**
 * dpdp-notice-lint engine: deterministic checks of a privacy notice's text against Section 5 of
 * the Digital Personal Data Protection Act, 2023 and Rule 3 of the DPDP Rules, 2025. Pure
 * functions, no I/O, no network: it runs in Node and in the browser.
 *
 * The engine emits only check ids, a status and the evidence it matched. Every word a reader
 * sees comes from the catalogue in `src/catalogue/`.
 */
import { CATALOGUE_VERSION, CHECKS } from './catalogue/index.js';
import type { CheckId, Status } from './catalogue/index.js';

export interface Evidence {
  /** The matched sentence, trimmed and capped. */
  quote: string;
  /** Offsets into `LintResult.text`. */
  start: number;
  end: number;
}

export interface CheckResult {
  id: CheckId;
  status: Status;
  evidence: Evidence[];
}

export interface LintResult {
  catalogueVersion: string;
  /** The text the checks ran on (HTML stripped if HTML was pasted). Offsets refer to it. */
  text: string;
  wordCount: number;
  results: CheckResult[];
}

/** Below this many words the information and review checks say "unclear" rather than guess. */
export const MIN_WORDS = 30;

/** Evidence quotes per check, at most. */
const MAX_EVIDENCE = 3;
const MAX_QUOTE = 240;

// ── Text preparation ────────────────────────────────────────────────────────

const BLOCK_TAG =
  /<\/?(?:p|div|h[1-6]|li|ul|ol|br|section|article|header|footer|main|tr|table|blockquote|dd|dt)\b[^>]*>/i;

/** Whether a paste looks like HTML rather than plain text. */
export function looksLikeHtml(text: string): boolean {
  return BLOCK_TAG.test(text);
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
};

/** HTML to text, keeping block boundaries as line breaks and list items as "- " lines. */
export function toPlainText(html: string): string {
  return html
    .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, '\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<li\b[^>]*>/gi, '\n- ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(?:p|div|h[1-6]|ul|ol|section|article|header|footer|main|tr|table|blockquote|dd|dt)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:amp|lt|gt|quot|#39|apos|nbsp);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => /\w/.test(w)).length;
}

// ── Segmentation ────────────────────────────────────────────────────────────

/** A sentence, heading or list item, with its offsets and the paragraph it sits in. */
export interface Unit {
  text: string;
  start: number;
  end: number;
  block: number;
  heading: boolean;
  listItem: boolean;
}

const LIST_MARK = /^\s*(?:[-*•▪◦–]|\d{1,2}[.)]|\(?[a-z]\)|\(?[ivx]{1,4}\))\s+/i;
/** A sentence ends at punctuation followed by whitespace or the end, so "example.in" never splits. */
const SENTENCE_END = /[.!?]+(?=\s|$)/g;

/** Sentences of one line, as [start, end) offsets within it. */
function sentenceSpans(line: string): Array<[number, number]> {
  const spans: Array<[number, number]> = [];
  let from = 0;
  for (let m = SENTENCE_END.exec(line); m; m = SENTENCE_END.exec(line)) {
    spans.push([from, m.index + m[0].length]);
    from = m.index + m[0].length;
  }
  if (from < line.length) spans.push([from, line.length]);
  return spans;
}

/** Split text into units. Headings are short lines without a full stop. */
export function segment(text: string): Unit[] {
  const units: Unit[] = [];
  const blockRe = /[^\n]+/g;
  let block = 0;
  for (let m = blockRe.exec(text); m; m = blockRe.exec(text)) {
    const raw = m[0];
    if (!raw.trim()) continue;
    const base = m.index;
    const listItem = LIST_MARK.test(raw);
    const trimmed = raw.trim();
    const words = countWords(trimmed);
    const heading =
      !listItem && (/^#{1,6}\s/.test(trimmed) || (words <= 10 && trimmed.length < 90 && !/[.!?]\s*$/.test(trimmed)));
    if (heading || listItem) {
      const lead = raw.length - raw.trimStart().length;
      units.push({ text: trimmed, start: base + lead, end: base + lead + trimmed.length, block, heading, listItem });
    } else {
      for (const [from, to] of sentenceSpans(raw)) {
        const piece = raw.slice(from, to);
        const sentence = piece.trim();
        if (!sentence) continue;
        const lead = piece.length - piece.trimStart().length;
        units.push({
          text: sentence,
          start: base + from + lead,
          end: base + from + lead + sentence.length,
          block,
          heading: false,
          listItem: false,
        });
      }
    }
    block += 1;
  }
  return units;
}

function evidenceOf(unit: Unit): Evidence {
  const quote = unit.text.length > MAX_QUOTE ? `${unit.text.slice(0, MAX_QUOTE - 1).trimEnd()}…` : unit.text;
  return { quote, start: unit.start, end: unit.end };
}

function evidence(units: Unit[]): Evidence[] {
  return units.slice(0, MAX_EVIDENCE).map(evidenceOf);
}

/** Units in the same paragraph as any of the given units (for "a link in the same paragraph"). */
function sameBlock(units: Unit[], anchors: Unit[]): Unit[] {
  const blocks = new Set(anchors.map((u) => u.block));
  return units.filter((u) => blocks.has(u.block));
}

/** The section a unit sits in: every unit from the nearest heading above it to the next heading. */
function sectionsUnder(units: Unit[], headingTest: RegExp): Unit[] {
  const out: Unit[] = [];
  let inside = false;
  for (const unit of units) {
    if (unit.heading) inside = headingTest.test(unit.text);
    else if (inside) out.push(unit);
  }
  return out;
}

// ── Shared phrase lists ─────────────────────────────────────────────────────

/** A link or other means by which the person can act: a URL, a screen, an address, a form. */
const MEANS =
  /https?:\/\/|www\.|\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b|\b(?:click|link|button|settings?|dashboard|account (?:page|settings)|privacy (?:centre|center|settings|dashboard|requests?)|preference(?:s| centre| center)?|toggle|write to|email(?:ing)? (?:us|at)|e-?mail (?:us|at)|contact us at|call (?:us )?(?:at|on)?\s*\+?\d|unsubscribe|in-app|in the app|within the app|visit|form|portal|helpdesk|help centre|help center|website)\b/i;

// ── N1: itemised personal data ──────────────────────────────────────────────

const DATA_ITEMS: ReadonlyArray<readonly [string, RegExp]> = [
  ['name', /\b(?:full |first |last |legal |your )?name\b/i],
  ['email', /\be-?mail(?: address| id)?\b/i],
  ['phone', /\b(?:phone|mobile|telephone|contact) (?:number|no\.?)\b|\bmobile\b|\bphone\b/i],
  [
    'address',
    /\b(?:postal|residential|billing|shipping|delivery|home|mailing|physical) address(?:es)?\b|(?<!ip |e-?mail |mac |web |url |wallet )\baddress(?:es)?\b/i,
  ],
  ['date of birth', /\bdate of birth\b|\bbirth ?date\b|\byour age\b|\bage\b/i],
  [
    'government id',
    /\b(?:pan|aadhaar|aadhar|passport|voter id|driving licen[cs]e|driver'?s licen[cs]e|government[- ]issued id|gstin|identity (?:card|document|proof))\b/i,
  ],
  [
    'payment',
    /\b(?:bank account|card (?:number|details)|credit card|debit card|upi(?: id)?|payment (?:details|information|card|method))\b/i,
  ],
  ['ip address', /\bip address(?:es)?\b/i],
  [
    'device',
    /\bdevice (?:id|identifier|information|type|model|data)s?\b|\badvertising id(?:entifier)?\b|\bbrowser type\b|\boperating system\b/i,
  ],
  ['location', /\b(?:geo-?)?location(?: data| information)?\b|\bgps\b/i],
  ['cookies', /\bcookies?\b/i],
  [
    'usage',
    /\busage (?:data|information|details)\b|\bbrowsing (?:history|behaviour|behavior|data)\b|\bpages (?:you )?visit(?:ed)?\b|\bclickstream\b/i,
  ],
  ['photo', /\bphotographs?\b|\bphotos?\b|\bprofile picture\b|\bimages? of you\b|\bvideo recordings?\b/i],
  ['health', /\bhealth (?:data|information|records?|conditions?)\b|\bmedical (?:data|information|records?|history)\b/i],
  [
    'employment',
    /\bemployer\b|\bemployment (?:details|history|information)\b|\boccupation\b|\bjob title\b|\bdesignation\b/i,
  ],
  ['account', /\busername\b|\bpasswords?\b|\blogin credentials\b|\baccount (?:name|id)\b/i],
  [
    'transactions',
    /\bcustomer id\b|\baccount number\b|\border (?:history|details)\b|\btransaction (?:history|details|data)\b|\bpurchase history\b/i,
  ],
  ['biometric', /\bbiometrics?\b|\bfingerprints?\b|\bface(?:prints?| recognition| scans?)\b|\bselfie\b/i],
  ['gender', /\bgender\b|\bsex\b/i],
  ['nationality', /\bnationality\b|\bcitizenship\b/i],
  ['signature', /\bsignatures?\b/i],
  ['vehicle', /\bvehicle (?:number|registration)\b|\bnumber plate\b/i],
];

const ENUMERATING = /\bsuch as\b|\bincluding\b|\bincludes?\b|\bfor example\b|\bnamely\b|\be\.g\.|:\s/i;

const GENERIC_DATA =
  /\b(?:information|data|details) (?:that |which )?you (?:provide|give|submit|share|enter)\b|\bcertain (?:personal )?(?:information|data)\b|\bsuch (?:other )?(?:information|data) as\b|\bother (?:information|data) (?:we|that we) (?:collect|receive|obtain)\b|\bpersonal (?:information|data) (?:we|that we|which we) (?:collect|receive|obtain|hold|process)\b/i;

function itemsIn(unit: Unit): string[] {
  return DATA_ITEMS.filter(([, re]) => re.test(unit.text)).map(([label]) => label);
}

function checkItemisedData(units: Unit[], all: Unit[]): CheckResult {
  const id: CheckId = 'N1';
  // Headings only name a section ("Personal data we collect"); items come from body and list units.
  const bearing = units.filter((u) => !u.heading && itemsIn(u).length > 0);
  const distinct = new Set(bearing.flatMap(itemsIn));
  const structured = bearing.filter((u) => u.listItem || ENUMERATING.test(u.text) || itemsIn(u).length >= 3);
  if (distinct.size >= 3 && structured.length > 0) {
    return { id, status: 'found', evidence: evidence(structured) };
  }
  const generic = all.filter((u) => GENERIC_DATA.test(u.text));
  if (distinct.size === 0) return { id, status: 'not_found', evidence: evidence(generic) };
  return { id, status: 'unclear', evidence: evidence([...bearing, ...generic]) };
}

// ── N2: purposes and what they enable ───────────────────────────────────────

const PURPOSE =
  /\bin order to\b|\bso that (?:we|you) can\b|\bso as to\b|\bfor the purposes? of\b|\bto (?:provide|deliver|process|fulfil|fulfill|send|respond|verify|create|manage|personali[sz]e|improve|communicate|prevent|detect|comply|enable|complete|ship|register|authenticate|contact|notify|recommend|analy[sz]e|secure|protect|bill|charge|issue|administer|maintain|operate|run|confirm|answer|keep|show|offer|arrange|book|reserve|dispatch|track|remind|invoice|onboard|open|service|support|market|advertise|train)\b/i;

const GENERIC_PURPOSE =
  /\bfor (?:any|other|business|commercial|our|internal|legitimate|various|general|such other) (?:lawful |legitimate |business )?purposes?\b|\bas (?:we|it) (?:may )?(?:deem|see|think|consider)s? (?:fit|appropriate|necessary)\b|\bfor any (?:lawful |other )?purpose\b|\bany other purpose\b/i;

const PURPOSE_HEADING =
  /purpose|how we use|why we (?:collect|use|process|need)|use of (?:your )?(?:personal )?(?:data|information)|what we do with/i;

function checkPurposes(units: Unit[]): CheckResult {
  const id: CheckId = 'N2';
  const specific = units.filter((u) => !u.heading && PURPOSE.test(u.text) && !GENERIC_PURPOSE.test(u.text));
  const generic = units.filter((u) => GENERIC_PURPOSE.test(u.text));
  const inSection = sectionsUnder(units, PURPOSE_HEADING).filter((u) => specific.includes(u));
  if (specific.length >= 3 || inSection.length >= 2) {
    return { id, status: 'found', evidence: evidence(inSection.length > 0 ? inSection : specific) };
  }
  if (specific.length === 0) return { id, status: 'not_found', evidence: evidence(generic) };
  return { id, status: 'unclear', evidence: evidence([...specific, ...generic]) };
}

// ── N3: withdrawing consent ─────────────────────────────────────────────────

const WITHDRAW =
  /\bwithdraw(?:al|ing|n|s)?\b[^.\n]{0,60}\bconsent\b|\bconsent\b[^.\n]{0,60}\bwithdraw(?:al|ing|n|s)?\b|\brevo(?:ke|cation|king)\b[^.\n]{0,40}\bconsent\b|\bconsent\b[^.\n]{0,40}\brevo(?:ke|cation|king)\b/i;
const OPT_OUT = /\bopt[- ]out\b/i;

function checkWithdrawal(units: Unit[]): CheckResult {
  const id: CheckId = 'N3';
  const withdraw = units.filter((u) => WITHDRAW.test(u.text));
  if (withdraw.length > 0) {
    const withMeans = withdraw.filter((u) => MEANS.test(u.text));
    const nearby = sameBlock(units, withdraw).filter((u) => MEANS.test(u.text));
    if (withMeans.length > 0 || nearby.length > 0) {
      return {
        id,
        status: 'found',
        evidence: evidence([...withMeans, ...nearby.filter((u) => !withMeans.includes(u))]),
      };
    }
    return { id, status: 'unclear', evidence: evidence(withdraw) };
  }
  const optOut = units.filter((u) => OPT_OUT.test(u.text));
  if (optOut.length > 0) return { id, status: 'unclear', evidence: evidence(optOut) };
  return { id, status: 'not_found', evidence: [] };
}

// ── N4: rights and the means ────────────────────────────────────────────────

const RIGHTS: ReadonlyArray<readonly [string, RegExp]> = [
  [
    'access',
    /\bright (?:to|of) access\b|\baccess (?:to )?(?:your|the|a copy of|a summary of)\b|\brequest (?:a copy|access|a summary)\b|\bobtain a (?:copy|summary)\b/i,
  ],
  ['correction', /\bcorrect(?:ion|ed|ing)?\b|\brectif(?:y|ication)\b|\bupdate (?:or correct )?your\b/i],
  ['erasure', /\beras(?:e|ure|ed)\b|\bdelet(?:e|ion|ed)\b/i],
  ['nomination', /\bnominat(?:e|ion|ed|ing)\b|\bnominee\b/i],
  ['grievance', /\bgrievances?\b/i],
];
const RIGHTS_CONTEXT = /\b(?:right|rights|request|ask|you (?:can|may)|entitled)\b/i;
const REQUEST_MEANS = /\brequest\b[^.\n]{0,40}\b(?:by|through|via|using)\b/i;

function checkRights(units: Unit[]): CheckResult {
  const id: CheckId = 'N4';
  const bearing = units.filter(
    (u) => !u.heading && RIGHTS_CONTEXT.test(u.text) && RIGHTS.some(([, re]) => re.test(u.text)),
  );
  const named = new Set(bearing.flatMap((u) => RIGHTS.filter(([, re]) => re.test(u.text)).map(([l]) => l)));
  if (named.size === 0) return { id, status: 'not_found', evidence: [] };
  const means = sameBlock(units, bearing).filter((u) => MEANS.test(u.text) || REQUEST_MEANS.test(u.text));
  if (named.size >= 3 && means.length > 0) {
    return {
      id,
      status: 'found',
      evidence: evidence([...means.filter((u) => bearing.includes(u)), ...bearing.filter((u) => !means.includes(u))]),
    };
  }
  return { id, status: 'unclear', evidence: evidence(bearing) };
}

// ── N5: complaint to the Board ──────────────────────────────────────────────

const BOARD = /\bData Protection Board(?: of India)?\b|\bDPBI?\b|\bthe Board\b/;
const NOT_THE_BOARD = /\bBoard of Directors\b|\bboard members?\b|\bon board\b/i;
const COMPLAINT =
  /\bcomplain(?:t|ts|ing)?\b|\bapproach\b|\bescalat(?:e|ion|ed)\b|\bgrievance\b|\bappeal\b|\braise\b|\bfile\b|\blodge\b/i;

function checkBoard(units: Unit[]): CheckResult {
  const id: CheckId = 'N5';
  const board = units.filter((u) => BOARD.test(u.text) && !NOT_THE_BOARD.test(u.text));
  if (board.length === 0) return { id, status: 'not_found', evidence: [] };
  const complaint = board.filter((u) => COMPLAINT.test(u.text));
  if (complaint.length > 0) {
    const withMeans = sameBlock(units, complaint).filter((u) => MEANS.test(u.text));
    if (withMeans.length > 0) {
      return {
        id,
        status: 'found',
        evidence: evidence([
          ...complaint.filter((u) => withMeans.includes(u)),
          ...complaint.filter((u) => !withMeans.includes(u)),
        ]),
      };
    }
  }
  return { id, status: 'unclear', evidence: evidence(complaint.length > 0 ? complaint : board) };
}

// ── N6: depends on another document ─────────────────────────────────────────

const OTHER_DOC =
  /\b(?:terms(?: of (?:service|use|business))?|terms and conditions|terms & conditions|user agreement|customer agreement|cookie policy|other polic(?:y|ies)|separate (?:document|policy|notice|agreement)|end[- ]user licen[cs]e agreement|eula|t&cs?|master services agreement|service agreement)\b/i;
const DEFER =
  /\b(?:see|refer to|please refer|(?:as |is |are )?(?:set out|described|detailed|explained|provided|stated|defined|outlined|specified) (?:in|under)|in accordance with|governed by|subject to|read (?:this )?(?:together|along) with|forms? part of|incorporated (?:by reference )?(?:in|into)|more (?:details|information) (?:in|under))\b/i;
const REQUIRED_ELEMENT =
  /\bpersonal (?:data|information)\b|\byour (?:data|information)\b|\bpurposes?\b|\bconsent\b|\bwithdraw/i;
const REQUIRED_ELEMENT_STRICT =
  /\brights?\b|\bcomplain|\bgrievance\b|\bcollect|\bprocess(?:ing|ed)?\b|\buse of your\b/i;

function checkStandsAlone(units: Unit[]): CheckResult {
  const id: CheckId = 'N6';
  const refs = units.filter((u) => OTHER_DOC.test(u.text) && DEFER.test(u.text));
  if (refs.length === 0) return { id, status: 'not_found', evidence: [] };
  const tied = refs.filter((u) => REQUIRED_ELEMENT.test(u.text) || REQUIRED_ELEMENT_STRICT.test(u.text));
  if (tied.length > 0) return { id, status: 'found', evidence: evidence(tied) };
  return { id, status: 'unclear', evidence: evidence(refs) };
}

// ── N7: plain-language signals ──────────────────────────────────────────────

const LONG_SENTENCE_WORDS = 35;
const PASSIVE = /\b(?:is|are|was|were|be|been|being)\s+(?:\w+ly\s+)?\w+(?:ed|en|wn)\b/i;
const DEFINED_TERM = /\(\s*["“']\s*[A-Z][\w\s-]*["”']\s*\)/g;

function checkPlainLanguage(units: Unit[], text: string): CheckResult {
  const id: CheckId = 'N7';
  const sentences = units.filter((u) => !u.heading);
  if (sentences.length < 5) return { id, status: 'unclear', evidence: [] };
  const lengths = sentences.map((u) => countWords(u.text));
  const long = sentences.filter((_, i) => (lengths[i] ?? 0) > LONG_SENTENCE_WORDS);
  const average = lengths.reduce((a, b) => a + b, 0) / sentences.length;
  const passive = sentences.filter((u) => PASSIVE.test(u.text));
  const definedTerms = (text.match(DEFINED_TERM) ?? []).length;
  const signal =
    long.length / sentences.length >= 0.25 ||
    average > 30 ||
    passive.length / sentences.length >= 0.4 ||
    definedTerms >= 8;
  if (!signal) return { id, status: 'not_found', evidence: [] };
  const longest = [...sentences].sort((a, b) => countWords(b.text) - countWords(a.text));
  return { id, status: 'found', evidence: evidence(long.length > 0 ? longest : [...passive]) };
}

// ── N8: language option ─────────────────────────────────────────────────────

const SCHEDULE_LANGUAGE =
  /\b(?:Hindi|Bengali|Bangla|Tamil|Telugu|Marathi|Gujarati|Kannada|Malayalam|Punjabi|Odia|Oriya|Assamese|Urdu|Sanskrit|Nepali|Konkani|Manipuri|Meitei|Bodo|Dogri|Maithili|Santali|Sindhi|Kashmiri)\b|\bEighth Schedule\b/;
const ENGLISH = /\bEnglish\b/;
const AVAILABLE =
  /\b(?:available|access|read|view|provided|offered|translat(?:ed|ion|ions)|choose|select|switch|version|language (?:option|selector|setting|menu)s?|in (?:the following|other|regional|Indian|these|any of these) languages?|in your (?:preferred |own )?language)\b/i;

function checkLanguage(units: Unit[]): CheckResult {
  const id: CheckId = 'N8';
  const offered = units.filter(
    (u) => (SCHEDULE_LANGUAGE.test(u.text) || /\blanguages\b/i.test(u.text)) && AVAILABLE.test(u.text),
  );
  if (offered.length > 0) return { id, status: 'found', evidence: evidence(offered) };
  const named = units.filter((u) => SCHEDULE_LANGUAGE.test(u.text) || (ENGLISH.test(u.text) && AVAILABLE.test(u.text)));
  if (named.length > 0) return { id, status: 'unclear', evidence: evidence(named) };
  return { id, status: 'not_found', evidence: [] };
}

// ── N9: grievance contact and period ────────────────────────────────────────

const CONTACT_ROLE =
  /\bgrievance (?:redressal )?officer\b|\bdata protection officer\b|\bDPO\b|\bnodal officer\b|\bprivacy officer\b|\bperson (?:who|able) to answer\b|\bdesignated officer\b|\bcompliance officer\b/i;
const CONTACT_DETAIL = /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b|\+?\d[\d\s()-]{8,}\d/;
const PERIOD =
  /\bwithin (?:a period of )?(?:\w+[- ])?(?:\(\d+\) )?(?:\d+ )?(?:days|working days|business days|hours|weeks?|months?)\b|\bninety days\b|\b90 days\b|\bwithin a reasonable (?:time|period)\b/i;
const GRIEVANCE_WORD = /\bgrievances?\b|\bcomplaints?\b|\brequests?\b|\brespond\b|\breply\b|\banswer\b/i;

function checkGrievanceContact(units: Unit[]): CheckResult {
  const id: CheckId = 'N9';
  const roles = units.filter((u) => CONTACT_ROLE.test(u.text));
  const contact = sameBlock(units, roles).filter((u) => CONTACT_DETAIL.test(u.text));
  const period = units.filter((u) => PERIOD.test(u.text) && GRIEVANCE_WORD.test(u.text));
  const hasContact = contact.length > 0;
  const hasPeriod = period.length > 0;
  if (hasContact && hasPeriod) return { id, status: 'found', evidence: evidence([...contact, ...period]) };
  if (hasContact || hasPeriod) return { id, status: 'unclear', evidence: evidence([...contact, ...period]) };
  return { id, status: 'not_found', evidence: evidence(roles) };
}

// ── N10: bundled consent ────────────────────────────────────────────────────

const BUNDLED = [
  /\bby (?:using|accessing|continuing to (?:use|access|browse)|browsing|visiting|registering|signing up|creating an account|installing|downloading|submitting|clicking)\b[^.\n]{0,120}\b(?:you (?:hereby )?(?:agree|consent|accept|acknowledge)|(?:constitutes?|signif(?:y|ies)|indicates?|implies|is deemed|shall be deemed)\b[^.\n]{0,30}(?:consent|acceptance|agreement))/i,
  /\bdeemed to (?:have )?(?:consent|accept|agree)/i,
  /\b(?:your )?continued use\b[^.\n]{0,80}\b(?:consent|accept|agree)/i,
  /\byour (?:use|access)\b[^.\n]{0,40}\b(?:constitutes|signifies|means|implies)\b[^.\n]{0,30}(?:consent|acceptance|agreement)/i,
];
const AGREE_TO_DOCUMENT =
  /\byou (?:hereby )?(?:consent|agree) to (?:this|the|our) (?:privacy )?(?:policy|notice|terms)\b/i;

function checkBundledConsent(units: Unit[]): CheckResult {
  const id: CheckId = 'N10';
  const bundled = units.filter((u) => BUNDLED.some((re) => re.test(u.text)));
  if (bundled.length > 0) return { id, status: 'found', evidence: evidence(bundled) };
  const blanket = units.filter((u) => AGREE_TO_DOCUMENT.test(u.text));
  if (blanket.length > 0) return { id, status: 'unclear', evidence: evidence(blanket) };
  return { id, status: 'not_found', evidence: [] };
}

// ── Entry point ─────────────────────────────────────────────────────────────

/** Checks whose answer on a very short text would be a guess; they say "unclear" instead. */
const UNCLEAR_WHEN_SHORT: ReadonlySet<CheckId> = new Set(['N6', 'N7', 'N9', 'N10']);

/**
 * Run every check over a notice. Accepts plain text or HTML. Deterministic: the same text gives
 * the same result, in catalogue order.
 */
export function lintNotice(input: string): LintResult {
  const text = looksLikeHtml(input) ? toPlainText(input) : input.replace(/\r\n?/g, '\n');
  const wordCount = countWords(text);
  const units = segment(text);
  const body = units.filter((u) => !u.heading);
  const byId: Record<CheckId, CheckResult> = {
    N1: checkItemisedData(units, units),
    N2: checkPurposes(units),
    // Headings only name a section ("Withdrawing your consent"); the element is in the body.
    N3: checkWithdrawal(body),
    N4: checkRights(body),
    N5: checkBoard(body),
    N6: checkStandsAlone(body),
    N7: checkPlainLanguage(units, text),
    N8: checkLanguage(units),
    N9: checkGrievanceContact(units),
    N10: checkBundledConsent(units),
  };
  const results = CHECKS.map((check) => {
    const result = byId[check.id];
    if (wordCount < MIN_WORDS && UNCLEAR_WHEN_SHORT.has(check.id)) {
      const unclear: CheckResult = { id: check.id, status: 'unclear', evidence: [] };
      return unclear;
    }
    return result;
  });
  return { catalogueVersion: CATALOGUE_VERSION, text, wordCount, results };
}
