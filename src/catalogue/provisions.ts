import type { Provision } from './types.js';

/**
 * Every provision the Notice Linter cites, with a short verbatim extract. Checked against
 * statecheck-docs `docs/legal_context/dpdpa_2023_full_text.md` (India Code) and
 * `dpdp_rules_2025.md` (G.S.R. 846(E) + 892(E)) on 2026-11-14. Change an extract only after
 * re-reading those files, and bump CATALOGUE_VERSION in checks.ts.
 */

/** Act S.3–17 and Rules 3, 5–16 commence on this date (G.S.R. 843(E); Rule 1(4)). */
export const APPLIES_FROM = '2027-05-13';

const NOTICE = 'Notice';
const CONSENT = 'Consent';
const RULE_3 = 'Notice given by Data Fiduciary to Data Principal';
const RULE_3_C =
  'give, the particular communication link for accessing the website or app, or both, of such Data Fiduciary, and a description of other means, if any, using which such Data Principal may—';

export const PROVISIONS = {
  'S.5(1)': {
    cite: 'S.5(1)',
    source: 'act',
    heading: NOTICE,
    text: 'Every request made to a Data Principal under section 6 for consent shall be accompanied or preceded by a notice given by the Data Fiduciary to the Data Principal',
    appliesFrom: APPLIES_FROM,
  },
  'S.5(1)(i)': {
    cite: 'S.5(1)(i)',
    source: 'act',
    heading: NOTICE,
    text: 'the personal data and the purpose for which the same is proposed to be processed',
    appliesFrom: APPLIES_FROM,
  },
  'S.5(1)(ii)': {
    cite: 'S.5(1)(ii)',
    source: 'act',
    heading: NOTICE,
    text: 'the manner in which she may exercise her rights under sub-section (4) of section 6 and section 13',
    appliesFrom: APPLIES_FROM,
  },
  'S.5(1)(iii)': {
    cite: 'S.5(1)(iii)',
    source: 'act',
    heading: NOTICE,
    text: 'the manner in which the Data Principal may make a complaint to the Board, in such manner and as may be prescribed.',
    appliesFrom: APPLIES_FROM,
  },
  'S.5(3)': {
    cite: 'S.5(3)',
    source: 'act',
    heading: NOTICE,
    text: 'The Data Fiduciary shall give the Data Principal the option to access the contents of the notice referred to in sub-sections (1) and (2) in English or any language specified in the Eighth Schedule to the Constitution.',
    appliesFrom: APPLIES_FROM,
  },
  'S.6(1)': {
    cite: 'S.6(1)',
    source: 'act',
    heading: CONSENT,
    text: 'The consent given by the Data Principal shall be free, specific, informed, unconditional and unambiguous with a clear affirmative action, and shall signify an agreement to the processing of her personal data for the specified purpose and be limited to such personal data as is necessary for such specified purpose.',
    appliesFrom: APPLIES_FROM,
  },
  'S.6(4)': {
    cite: 'S.6(4)',
    source: 'act',
    heading: CONSENT,
    text: 'Where consent given by the Data Principal is the basis of processing of personal data, such Data Principal shall have the right to withdraw her consent at any time, with the ease of doing so being comparable to the ease with which such consent was given.',
    appliesFrom: APPLIES_FROM,
  },
  'S.6(6)': {
    cite: 'S.6(6)',
    source: 'act',
    heading: CONSENT,
    text: 'If a Data Principal withdraws her consent to the processing of personal data under sub-section (5), the Data Fiduciary shall, within a reasonable time, cease and cause its Data Processors to cease processing the personal data of such Data Principal unless such processing without her consent is required or authorised under the provisions of this Act or the rules made thereunder or any other law for the time being in force in India.',
    appliesFrom: APPLIES_FROM,
  },
  'S.6(10)': {
    cite: 'S.6(10)',
    source: 'act',
    heading: CONSENT,
    text: 'Where a consent given by the Data Principal is the basis of processing of personal data and a question arises in this regard in a proceeding, the Data Fiduciary shall be obliged to prove that a notice was given by her to the Data Principal and consent was given by such Data Principal to the Data Fiduciary in accordance with the provisions of this Act and the rules made thereunder.',
    appliesFrom: APPLIES_FROM,
  },
  'S.8(9)': {
    cite: 'S.8(9)',
    source: 'act',
    heading: 'General obligations of Data Fiduciary',
    text: 'A Data Fiduciary shall publish, in such manner as may be prescribed, the business contact information of a Data Protection Officer, if applicable, or a person who is able to answer on behalf of the Data Fiduciary, the questions, if any, raised by the Data Principal about the processing of her personal data.',
    appliesFrom: APPLIES_FROM,
  },
  'S.8(10)': {
    cite: 'S.8(10)',
    source: 'act',
    heading: 'General obligations of Data Fiduciary',
    text: 'A Data Fiduciary shall establish an effective mechanism to redress the grievances of Data Principals.',
    appliesFrom: APPLIES_FROM,
  },
  'S.11–S.14': {
    cite: 'S.11–S.14',
    source: 'act',
    heading: 'Rights and Duties of Data Principal',
    text: 'Right to access information about personal data (S.11); Right to correction and erasure of personal data (S.12); Right of grievance redressal (S.13); Right to nominate (S.14).',
    appliesFrom: APPLIES_FROM,
  },
  'S.13(3)': {
    cite: 'S.13(3)',
    source: 'act',
    heading: 'Right of grievance redressal',
    text: 'The Data Principal shall exhaust the opportunity of redressing her grievance under this section before approaching the Board.',
    appliesFrom: APPLIES_FROM,
  },
  'Rule 3(a)': {
    cite: 'Rule 3(a)',
    source: 'rules',
    heading: RULE_3,
    text: 'be presented and be understandable independently of any other information that has been, is or may be made available by such Data Fiduciary',
    appliesFrom: APPLIES_FROM,
  },
  'Rule 3(b)': {
    cite: 'Rule 3(b)',
    source: 'rules',
    heading: RULE_3,
    text: 'give, in clear and plain language, a fair account of the details necessary to enable the Data Principal to give specific and informed consent for the processing of her personal data, which shall include, at the minimum,—',
    appliesFrom: APPLIES_FROM,
  },
  'Rule 3(b)(i)': {
    cite: 'Rule 3(b)(i)',
    source: 'rules',
    heading: RULE_3,
    text: 'an itemised description of such personal data',
    appliesFrom: APPLIES_FROM,
  },
  'Rule 3(b)(ii)': {
    cite: 'Rule 3(b)(ii)',
    source: 'rules',
    heading: RULE_3,
    text: 'the specified purpose or purposes of, and specific description of the goods or services to be provided or uses to be enabled by, such processing',
    appliesFrom: APPLIES_FROM,
  },
  'Rule 3(c)(i)': {
    cite: 'Rule 3(c)(i)',
    source: 'rules',
    heading: RULE_3,
    text: `${RULE_3_C} (i) withdraw her consent, with the ease of doing so being comparable to that with which such consent was given`,
    appliesFrom: APPLIES_FROM,
  },
  'Rule 3(c)(ii)': {
    cite: 'Rule 3(c)(ii)',
    source: 'rules',
    heading: RULE_3,
    text: `${RULE_3_C} (ii) exercise her rights under the Act`,
    appliesFrom: APPLIES_FROM,
  },
  'Rule 3(c)(iii)': {
    cite: 'Rule 3(c)(iii)',
    source: 'rules',
    heading: RULE_3,
    text: `${RULE_3_C} (iii) make a complaint to the Board.`,
    appliesFrom: APPLIES_FROM,
  },
  'Rule 9': {
    cite: 'Rule 9',
    source: 'rules',
    heading: 'Contact information of person to answer questions about processing',
    text: 'Every Data Fiduciary shall prominently publish on its website or app, and mention in every response to a communication for the exercise of the rights of a Data Principal under the Act, the business contact information of the Data Protection Officer, if applicable, or a person who is able to answer on behalf of the Data Fiduciary the questions of the Data Principal about the processing of her personal data.',
    appliesFrom: APPLIES_FROM,
  },
  'Rule 14(1)(a)': {
    cite: 'Rule 14(1)(a)',
    source: 'rules',
    heading: 'Rights of Data Principals',
    text: 'the Data Fiduciary and, where applicable, the Consent Manager, shall prominently publish on its website or app, or both, as the case may be,— (a) the details of the means using which a Data Principal may make a request for the exercise of such rights',
    appliesFrom: APPLIES_FROM,
  },
  'Rule 14(1)(b)': {
    cite: 'Rule 14(1)(b)',
    source: 'rules',
    heading: 'Rights of Data Principals',
    text: 'the particulars, if any, such as the username or other identifier of such a Data Principal, which may be required to identify her under its terms of service.',
    appliesFrom: APPLIES_FROM,
  },
  'Rule 14(3)': {
    cite: 'Rule 14(3)',
    source: 'rules',
    heading: 'Rights of Data Principals',
    text: 'Every Data Fiduciary and Consent Manager shall prominently publish on its website or app, or both, as the case may be, within a reasonable period not exceeding ninety days under its grievance redressal system for responding to the grievances of Data Principals',
    appliesFrom: APPLIES_FROM,
  },
} as const satisfies Record<string, Provision>;

export type ProvisionCite = keyof typeof PROVISIONS;
