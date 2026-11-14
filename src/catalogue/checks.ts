import type { ProvisionCite } from './provisions.js';
import type { Certainty, CertaintyDef, CheckDef, Status, StatusDef } from './types.js';

/**
 * Bump on any change to a string, label or cite in this folder: `YYYY-MM-DD-draftN` until the
 * owner's legal review, then `YYYY-MM-DD`, with `-rN` for a second change on the same day. Every
 * result is stamped with it, so a consumer can tell which wording a result was built against.
 *
 * 2026-11-14: the ten checks, written from the notified texts and reviewed by the owner on
 * GitHub. Decisions: an English-only notice satisfies S.5(3) (N8 found); N9 stays as
 * information; N5 names the Board and notes that its complaint channel is pending.
 */
export const CATALOGUE_VERSION = '2026-11-14';

export const CERTAINTY: Record<Certainty, CertaintyDef> = {
  settled: {
    label: 'Settled',
    meaning: 'The Act or the Rules expressly require this element, and the check looks for it directly.',
  },
  likely: {
    label: 'Likely',
    meaning:
      'A reasonable reading of the text, but it depends on a point the text does not settle, or on a judgement about the wording.',
  },
  open: {
    label: 'Open',
    meaning:
      'A heuristic, or a point reasonable lawyers could disagree on. Shown as information for the drafter, never as a gap.',
  },
};

export const STATUS_TEXT: Record<Status, StatusDef> = {
  found: {
    label: 'Found',
    meaning:
      'The linter matched text that looks like this element or pattern. The match is quoted so you can check it.',
  },
  not_found: {
    label: 'Not found',
    meaning:
      'The linter did not find it in the text you pasted. It may be elsewhere, or worded in a way the linter does not recognise.',
  },
  unclear: {
    label: 'Unclear',
    meaning: 'The linter found part of it, or text it could not place. Read the quote and decide.',
  },
};

/** Shown once on every result, above the checks. "Your browser" wording is for the web page; the CLI keeps nothing either. */
export const RESULT_CAVEATS: string[] = [
  'We checked this text only. "Not found" means the linter did not find it in what you pasted, not that it does not exist.',
  'The text stays in your browser. Nothing is sent to us or stored.',
  'Rule 3 governs the notice that accompanies a request for consent. A privacy policy page may be that notice, or your consent screen may be. Check the text you actually show.',
  'The provisions cited here commence on 13 May 2027.',
  'This tool gives no verdict and is not legal advice.',
];

/** The result's "what we could not check" section. */
export const NOT_CHECKED: string[] = [
  'Text in languages other than English. The checks read English wording only, so paste the English version.',
  'Whether each item of personal data is tied to its purpose. We check that both are stated.',
  'Whether withdrawing consent is as easy as giving it. We check that the means is described.',
  'The consent screen itself, PDF layout and images. Paste the words.',
];

export const CHECKS: CheckDef<ProvisionCite>[] = [
  {
    id: 'N1',
    title: 'An itemised description of the personal data',
    kind: 'element',
    foundMeans: 'present',
    looksFor:
      'A list of the personal data the notice covers, item by item: name, email address, phone number, date of birth, and so on. A list, or a sentence that names the items, counts. "Information you provide" on its own does not.',
    statusText: {
      found: 'We found a list that names the items of personal data.',
      not_found:
        'We did not find a list of personal data items in this text. Where we found a general phrase instead, it is quoted below.',
      unclear:
        'We found some items of personal data named, but not enough of them, or not together in one place, to call it an itemised description. Check that each item the notice covers is named.',
    },
    fix: [
      'Name every item of personal data the processing covers, one per line, under its own heading.',
      'Keep the list to what the consent covers: the Act limits consent to the personal data necessary for the specified purpose (S.6(1)).',
      'Replace catch-all phrases such as "information you provide" with the items themselves.',
    ],
    provisions: ['Rule 3(b)(i)', 'S.5(1)(i)'],
    certainty: 'settled',
  },
  {
    id: 'N2',
    title: 'The purposes, and what each one enables',
    kind: 'element',
    foundMeans: 'present',
    looksFor:
      'Sentences that say what the personal data is used for and the service, good or use that follows: "to deliver your order", "to send the receipt". A heading such as "How we use your data" with several specific purposes under it counts. "For business purposes" or "for any purpose" does not.',
    statusText: {
      found: 'We found specific purposes stated, with the service or use they enable.',
      not_found:
        'We did not find a specific purpose in this text. Where we found a catch-all phrase instead, it is quoted below.',
      unclear:
        'We found one or two purpose statements, or only general ones. Check that every purpose is stated and says what it enables.',
    },
    fix: [
      'State each purpose in one line, with the good, service or use it enables: "to deliver what you ordered", "to send you the invoice".',
      'Where one item of personal data serves several purposes, say so against the item or the purpose, so the two can be read together (S.5(1)(i)).',
      'Remove "for any other purpose" and similar catch-alls: consent must be specific (S.6(1)).',
    ],
    provisions: ['Rule 3(b)(ii)', 'S.5(1)(i)'],
    certainty: 'settled',
    caveat: 'We check that purposes are stated, not that every item of personal data is tied to one.',
  },
  {
    id: 'N3',
    title: 'How to withdraw consent',
    kind: 'element',
    foundMeans: 'present',
    looksFor:
      'A sentence that says consent can be withdrawn, together with the way to do it: a link, a settings page, an email address or a form. Rule 3(c) asks for the communication link for the website or app and a description of any other means.',
    statusText: {
      found: 'We found how consent can be withdrawn, with a link or other means.',
      not_found: 'We did not find a way to withdraw consent in this text.',
      unclear:
        'We found that consent can be withdrawn, but not the link or means to do it. Add the link and describe any other way.',
    },
    fix: [
      'Add the link to the page or screen where the person withdraws consent, and describe any other way, such as an email address.',
      'Make withdrawing as easy as giving: if consent was one tap, withdrawal should be one tap (S.6(4)).',
      'Say what happens after withdrawal: processing stops within a reasonable time unless another law requires it (S.6(6)).',
    ],
    provisions: ['Rule 3(c)(i)', 'S.6(4)', 'S.5(1)(ii)'],
    certainty: 'settled',
    caveat: 'We check that a means is described, not that withdrawing is as easy as giving consent.',
  },
  {
    id: 'N4',
    title: 'How to exercise the rights under the Act',
    kind: 'element',
    foundMeans: 'present',
    looksFor:
      'The rights named (access, correction, erasure, nomination, grievance redressal) and the way to use them: a form, an email address, a link or an account page.',
    statusText: {
      found: 'We found the rights named, with a way to exercise them.',
      not_found: 'We did not find the rights under the Act, or a way to exercise them, in this text.',
      unclear:
        'We found some rights named, or the rights without a way to exercise them. Check that access, correction, erasure, nomination and grievance redressal are each covered, with the means.',
    },
    fix: [
      'Name each right: access to information about the personal data (S.11), correction and erasure (S.12), grievance redressal (S.13) and nomination (S.14).',
      'Give the means for each: the form, email address or account page, and any identifier the person must quote (Rule 14(1)(a) and Rule 14(1)(b)).',
      'Say how long a grievance takes to answer, within your published period, which the Rules cap at ninety days (Rule 14(3)).',
    ],
    provisions: ['Rule 3(c)(ii)', 'S.5(1)(ii)', 'S.11–S.14', 'Rule 14(1)(a)'],
    certainty: 'settled',
  },
  {
    id: 'N5',
    title: 'How to complain to the Data Protection Board',
    kind: 'element',
    foundMeans: 'present',
    looksFor:
      'A sentence that names the Data Protection Board of India and says how to make a complaint to it, with a link or other means. A "Board of Directors" does not count.',
    statusText: {
      found: 'We found how to complain to the Board, with a link or other means.',
      not_found: 'We did not find the Data Protection Board in this text.',
      unclear: 'We found the Board named, but not how to complain to it, or no link or means. Add both.',
    },
    fix: [
      'Name the Data Protection Board of India and say that a person may complain to it after raising the grievance with you first (S.13(3)).',
      "Say a person may complain to the Board after your grievance process, with the Board's link or other means. The Board has not yet published its complaint channel, so add the link once it does.",
      'Keep this next to your own grievance contact, so the order (you first, then the Board) is clear.',
    ],
    provisions: ['Rule 3(c)(iii)', 'S.5(1)(iii)', 'S.13(3)'],
    certainty: 'settled',
  },
  {
    id: 'N6',
    title: 'The notice stands on its own',
    kind: 'review',
    foundMeans: 'concern',
    looksFor:
      'Sentences that send the reader to another document for a required element: "see our terms of service for how to withdraw consent", "as set out in the user agreement". Links to the Board, to your own forms or to a settings page are not deferrals.',
    statusText: {
      found:
        'We found a sentence that points to another document for one of the required elements. Rule 3(a) asks that the notice be understandable on its own.',
      not_found: 'We did not find a sentence that sends the reader to another document for a required element.',
      unclear:
        'We found a reference to another document, but could not tell whether a required element depends on it. Read the quoted sentence and decide.',
    },
    fix: [
      'Bring the required element into the notice itself; the other document can repeat it.',
      'Keep links for actions (withdraw, request, complain), not for the explanation of what the notice must say.',
    ],
    provisions: ['Rule 3(a)'],
    certainty: 'likely',
    caveat:
      'Whether a cross-reference makes the notice depend on another document is a judgement. We flag the sentence; a lawyer decides.',
  },
  {
    id: 'N7',
    title: 'Plain-language signals',
    kind: 'information',
    foundMeans: 'concern',
    looksFor:
      'Long sentences, a high share of passive sentences and many defined terms. These are signals, not a test: Rule 3(b) asks for clear and plain language and sets no measure.',
    statusText: {
      found:
        'We found sentences that run long, lean on the passive voice or depend on many defined terms. The longest are quoted below.',
      not_found:
        'We did not find a strong signal against plain language. That is not a finding that the language is plain.',
      unclear: 'The text is too short to say anything about its language.',
    },
    fix: [
      'Split any sentence that runs past about thirty-five words.',
      'Say who does what: "we delete your data" rather than "data will be deleted".',
      'Keep defined terms to the few the Act uses, such as personal data and consent.',
    ],
    provisions: ['Rule 3(b)'],
    certainty: 'open',
    caveat:
      'A heuristic. The Rule sets no sentence length or style test, so this is information for the drafter, never a finding.',
  },
  {
    id: 'N8',
    title: 'The option to read the notice in English or an Eighth Schedule language',
    kind: 'element',
    foundMeans: 'present',
    looksFor:
      'A sentence that says the notice is available in English or in a language in the Eighth Schedule to the Constitution, such as Hindi, Tamil or Bengali, and how to get it.',
    statusText: {
      found: 'We found the notice offered in English or an Eighth Schedule language.',
      not_found: 'We did not find a language option in this text.',
      unclear: 'We found a language named, but not an offer to read the notice in it.',
    },
    fix: [
      'Say which languages the notice is available in and how to switch, such as a language selector on the page.',
      'Offer at least English and the Eighth Schedule languages your users read. Translate the notice itself, not only the heading.',
    ],
    provisions: ['S.5(3)'],
    certainty: 'likely',
    caveat:
      'S.5(3) gives the option to access the notice in English or any Eighth Schedule language, so a notice offered in English alone is found. Whether your users need an Eighth Schedule language is a question for you, not the linter.',
  },
  {
    id: 'N9',
    title: 'Grievance contact and response period',
    kind: 'information',
    foundMeans: 'present',
    looksFor:
      'The business contact of a Data Protection Officer or of the person who answers questions about processing (an email address or phone number), and the period within which a grievance is answered.',
    statusText: {
      found: 'We found a contact to answer questions and a grievance response period.',
      not_found: 'We did not find a contact to answer questions, or a grievance response period, in this text.',
      unclear: 'We found one of the two: the contact or the period. Check the other.',
    },
    fix: [
      'Publish the business contact of the Data Protection Officer, where you must have one, or of the person who can answer questions about processing (S.8(9), Rule 9).',
      'State the period within which you answer grievances, which the Rules cap at ninety days (Rule 14(3)).',
    ],
    provisions: ['S.8(9)', 'Rule 9', 'S.8(10)', 'Rule 14(3)'],
    certainty: 'likely',
    caveat:
      'Not a Rule 3 element: these duties attach to the website or app, and most companies meet them in the notice. Reported as information, never counted.',
  },
  {
    id: 'N10',
    title: 'Consent bundled into use of the service',
    kind: 'review',
    foundMeans: 'concern',
    looksFor:
      'Sentences that treat using the site or app as consent: "by using our services you consent to this policy", "continued use constitutes acceptance".',
    statusText: {
      found:
        'We found a sentence that treats use of the service as consent. Consent must be free, specific, informed, unconditional and unambiguous, with a clear affirmative action (S.6(1)).',
      not_found: 'We did not find a sentence that treats use of the service as consent.',
      unclear:
        'We found a sentence that asks the reader to agree to the policy as a whole. Check that consent is asked for each specified purpose, not for the document.',
    },
    fix: [
      'Remove "by using you agree" language from the notice. The notice informs; consent is asked separately, by a clear affirmative action.',
      'Ask for consent per purpose, and keep a record of what was shown and what was chosen (S.6(10)).',
    ],
    provisions: ['S.6(1)'],
    certainty: 'likely',
    caveat:
      'The notice itself is not the consent request; a sentence like this may be harmless if the request is made properly elsewhere. It is a point to review, not a Rule 3 element.',
  },
];

export const CHECKS_BY_ID: Record<string, CheckDef<ProvisionCite>> = Object.fromEntries(
  CHECKS.map((check) => [check.id, check]),
);
