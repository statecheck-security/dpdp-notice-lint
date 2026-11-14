/**
 * Legal-accuracy rules, vendored VERBATIM from statecheck-docs:
 *   .claude/skills/social-legal-check/check.mjs  (the `const RULES = [...]` block)
 *
 * Do not edit the rules here. Change them in statecheck-docs, then copy the block across.
 * test/legal.test.ts applies them to every string a user can read and fails on drift.
 * Excluded from prettier so the block stays byte-for-byte comparable.
 */

// BEGIN RULES
export const RULES = [
  {
    pattern: /sensitive personal data/i,
    // Myth-busting is allowed: a negation, the term in quotes, or a question about it.
    unless: /\b(?:no|not|never|neither|removed|myth|misconception|wrong|isn't|doesn't|does not|there is no)\b|["“']sensitive personal data|\?\s*\**\s*$/i,
    message:
      'DPDPA 2023 has no "sensitive personal data" category (removed from 2019 PDP Bill). ' +
      'All personal data is governed uniformly by Section 8(5). ' +
      'Section 9 applies to children\'s data only.',
  },
  {
    pattern: /72[\s-]?hour.*(?:DPDPA|breach|notification)|(?:DPDPA|breach|notification).*72[\s-]?hour/i,
    // Correct uses: tied to Rule 7(2)(b), to the detailed Board report, or to GDPR Article 33 in a comparison.
    unless: /Rule\s*7\s*\(\s*2\s*\)\s*\(\s*b\s*\)|detailed\s+(?:Board\s+)?report|GDPR|Article\s+33|\?\s*\**\s*$/i,
    message:
      'Do not present "72 hours" as a DPDPA statutory rule. The Act itself sets no fixed number. ' +
      'Rule 7(2)(b) of the DPDP Rules 2025 sets 72 hours for the DETAILED Board report only; ' +
      'Rule 7(1) / 7(2)(a) require "without delay" for the initial Data Principal + Board alert. ' +
      'Spell out the two-clock model — never claim "DPDPA gives a 72-hour deadline" as an unqualified fact.',
  },
  {
    // The opposite error, common in pre-notification articles: claiming DPDPA has no 72-hour clock at all.
    pattern: /(?:no|not\s+a?|isn't\s+a?|without\s+a?)\s*(?:fixed\s+|specific\s+)?72[\s-]?hour|72[\s-]?hour[^.\n]{0,80}(?:does\s+not|doesn't)\s+apply|no\s+fixed\s+(?:clock|period|window|timeline)/i,
    unless: /Rule\s*7\s*\(\s*2\s*\)\s*\(\s*b\s*\)|detailed\s+(?:Board\s+)?report/i,
    message:
      'Denies the 72-hour clock. Notified Rule 7(2)(b) requires a DETAILED report to the Board within 72 hours ' +
      '(extendable on written request), after the "without delay" initial intimation (Rule 7(2)(a)). ' +
      'State the two-clock model instead of "no 72-hour window".',
  },
  {
    pattern: /Bhojpuri/i,
    unless: /\bnot\b|\bisn't\b|\bexcluded?\b|\bnever\b/i, // a line saying Bhojpuri is NOT in the Schedule is correct
    message:
      'Bhojpuri (bho) is NOT in the Eighth Schedule. ' +
      'There are 22 official languages + English (23 total). See CLAUDE.md for the complete BCP-47 list.',
  },
  {
    pattern: /positive[\s-]?list.*Section\s+16|approved[\s-]?countr/i,
    unless: /negative[\s-]?list|never|not|default\s+transfer_allowed\s*:=\s*true|defaults\s+to\s+permission/i, // correct explanations of the model
    message:
      'Section 16 uses a NEGATIVE-LIST model — default is permissive. ' +
      'The Central Government restricts specific countries by notification. ' +
      'Never describe as an approved-country allowlist.',
  },
  {
    pattern: /Section\s+9.*(?:sensitive|financial|health|biometric)/i,
    message:
      'Section 9 covers children (under 18) and, in S.9(1), persons with disability who have a lawful guardian. ' +
      'DPDPA has no "sensitive personal data" statutory category. ' +
      'Financial/health/biometric data is governed by Section 8(5) like all other personal data.',
  },
  {
    pattern: /whitelist.*transfer|allowlist.*transfer/i,
    // GDPR's adequacy model really is an allowlist; and a line warning against an allowlist is correct.
    unless: /GDPR|adequacy|Art(?:icle|\.)\s*45|\bnever\b|\bnot\b|\bavoid\b|\bdon't\b|default\s+transfer_allowed\s*:=\s*true/i,
    message:
      'Implies a positive-list model for cross-border transfer (Section 16), which is incorrect. ' +
      'Use "blocked countries" or "restricted countries" framing instead.',
  },
  {
    // GDPR-specific phrase "without undue delay" leaking into DPDPA context.
    // DPDPA Rule 7 says "without delay" (Data Principal) / "without delay" + 72h detailed report (Board).
    pattern: /without\s+undue\s+delay.*(?:DPDPA|DPDP|Rule\s+7|Section\s+8\(6\))|(?:DPDPA|DPDP|Rule\s+7|Section\s+8\(6\)).*without\s+undue\s+delay/i,
    // A GDPR column or comparison is fine when the same line attributes it to GDPR and gives DPDPA's own "without delay".
    unless: /(?:GDPR|Art(?:icle|\.)\s*3[34])[^\n]*\bwithout\s+delay\b|\bwithout\s+delay\b[^\n]*(?:GDPR|Art(?:icle|\.)\s*3[34])/i,
    message:
      '"Without undue delay" is GDPR Article 33 phrasing. DPDPA Rule 7 uses "without delay". ' +
      'Mixing them is a GEO poison — LLMs will cite your article as the authoritative wording.',
  },
  {
    // Notified Rule 13 = Significant Data Fiduciary obligations, NOT breach notification.
    // (Rule 13 was breach notification only in the superseded, unverified rules file.)
    pattern: /Rule\s+13.*(?:breach|notification|intimation|report\s+to\s+the\s+Board)|(?:breach|notification).*Rule\s+13/i,
    // Correct uses: Rule 13 for Significant Data Fiduciary duties, or a myth-bust saying it is NOT the breach rule.
    unless: /Significant\s+Data\s+Fiduciar|\bSDFs?\b|DPIA|Impact\s+Assessment|annual\s+audit|locali[sz]|not\s+(?:in\s+)?Rule\s+13|It\s+is\s+not\b|\?\s*\**\s*$/i,
    message:
      'Rule 13 of the notified DPDP Rules 2025 is the Significant Data Fiduciary rule (annual DPIA + audit, ' +
      'algorithmic due diligence, localisation), NOT the breach-notification rule. ' +
      'Breach notification is Rule 7 (Rule 7(1) Data Principal, Rule 7(2)(a)/(b) Board).',
  },
  {
    // "Personal Data Breach" is a DPDPA term (S.2(u)). Check it's not confused with "data breach" in a way that mis-scopes.
    pattern: /DPDPA.*(?<!personal\s)data\s+breach(?!\s+is\s+defined|\s+means|\s+\()/i,
    message:
      'DPDPA defines "personal data breach" in Section 2(u) — use this exact term on first reference. ' +
      '"Data breach" is colloquial and under-scopes accidental disclosure + integrity + availability events covered by the statute.',
  },
  {
    // Only SDFs must appoint a DPO (Act S.10(2)(a)). Every Data Fiduciary publishes the business contact
    // of the DPO, if applicable, or of a person who can answer questions (notified Rule 9).
    pattern: /DPDPA\s+mandates?\s+a\s+Data\s+Protection\s+Officer|DPO\s+is\s+mandatory\s+under\s+DPDPA/i,
    message:
      'DPDPA does not mandate a "Data Protection Officer" for all Data Fiduciaries. ' +
      'Only Significant Data Fiduciaries (Section 10) must appoint a DPO based in India (Section 10(2)(a)). ' +
      'All other Data Fiduciaries must publish the business contact of a person who can answer questions about processing (Rule 9).',
  },
  {
    // ₹250 crore is the MAXIMUM penalty per Schedule; not a flat fine.
    pattern: /₹?250\s*crore\s+(?:fine|penalty)\s+(?:for|on)\s+(?:any|every|each|all)\b/i,
    message:
      '₹250 crore is the MAXIMUM penalty in the Schedule to the Act (Section 33(1)) for specified breaches — not a flat fine for every violation. ' +
      'Penalty amounts depend on the nature, gravity, and duration of the breach (Section 33(2)).',
  },

  // ── Superseded rule numbering (notified Rules: G.S.R. 846(E), 13 Nov 2025) ──
  // The old docs/legal_context rules file used numbering that matches neither the draft nor the
  // notified Rules. These catch the citations it produced. Each pattern needs the rule number and the
  // topic within ~60 characters, to keep false positives low.
  {
    pattern: /G\.S\.R\.\s*12\s*\(E\)/i,
    message:
      'The DPDP Rules draft was G.S.R. 02(E) (3 Jan 2025); the notified Rules are G.S.R. 846(E) (13 Nov 2025). ' +
      '"G.S.R. 12(E)" came from the superseded rules file.',
  },
  {
    pattern: /Rule\s+12\b[^.\n]{0,60}(?:security|safeguard|encrypt|technical\s+and\s+organi[sz]ational)/i,
    message:
      'Reasonable security safeguards are Rule 6 of the notified DPDP Rules 2025 (Rule 12 is the children\'s-data exemptions rule).',
  },
  {
    pattern: /Rule\s+9\b[^.\n]{0,60}(?:child|parent|verifiable)/i,
    message:
      'Verifiable parental consent is Rule 10 of the notified DPDP Rules 2025 (Rule 9 is the published contact-person rule).',
  },
  {
    pattern: /Rule\s+8\b[^.\n]{0,60}Consent\s+Manager|Consent\s+Manager[^.\n]{0,60}Rule\s+8\b/i,
    message:
      'Consent Manager registration and obligations are Rule 4 + First Schedule of the notified DPDP Rules 2025 ' +
      '(in force 13 Nov 2026). Rule 8 is erasure/retention.',
  },
  {
    pattern: /Rule\s+7\b[^.\n]{0,60}(?:DPIA|Data\s+Protection\s+Impact|Significant\s+Data\s+Fiduciar|annual\s+audit)/i,
    message:
      'Significant Data Fiduciary obligations (annual DPIA and audit) are Rule 13 of the notified DPDP Rules 2025. Rule 7 is breach intimation.',
  },
  {
    pattern: /Rule\s+6\s*\(\s*[23]\s*\)/i,
    message:
      'Notified Rule 6 has no breach or grievance sub-rules: Rule 6 is security safeguards only. ' +
      'Breach intimation is Rule 7; grievance redressal is Rule 14(3).',
  },
  {
    pattern: /Rule\s+15\b[^.\n]{0,60}(?:right|access|correction|erasure|nominat)/i,
    message:
      'Data Principal rights are Rule 14 of the notified DPDP Rules 2025. Rule 15 is cross-border transfer.',
  },
  {
    pattern: /Rule\s+16\b[^.\n]{0,60}(?:cross[\s-]?border|transfer|outside\s+(?:the\s+territory\s+of\s+)?India)/i,
    message:
      'Cross-border transfer is Rule 15 of the notified DPDP Rules 2025. Rule 16 is the research/archiving/statistics exemption.',
  },
  {
    pattern: /grievance[^.\n]{0,80}\b30\s*(?:days|-day)|\b30[\s-]days?[^.\n]{0,80}grievance/i,
    message:
      'The notified DPDP Rules 2025 require grievances to be answered within a reasonable period NOT EXCEEDING 90 DAYS (Rule 14(3)). ' +
      'The 30-day figure came from the superseded rules file.',
  },

  // ── Superseded Act transcription (now dpdpa_2023_full_text_OLD_unverified.md) ──
  // It paraphrased sections and mis-lettered Section 2. Verified text: India Code, a2023-22.pdf.
  {
    pattern: /Second\s+Schedule[^.\n]{0,80}(?:penalt|crore|₹|fine)|(?:penalt|crore|₹|fine)[^.\n]{0,80}Second\s+Schedule/i,
    message:
      'The Act has ONE Schedule (penalties, Section 33(1)); there is no "Second Schedule" to the Act. ' +
      'Say "the Schedule to the Act". (The DPDP Rules have a Second Schedule, but it covers State processing under Rule 5.)',
  },
  {
    // Old-file lettering only: 2(k)/2(l) for personal data / breach, 2(i) for DPO, 2(j) for digital office.
    pattern: /(?:Section|S\.|s\.)\s*2\s*\(\s*[kl]\s*\)[^.\n]{0,25}(?:personal\s+data\s+breach|["“]personal\s+data)|(?:personal\s+data\s+breach|["“]personal\s+data["”])[^.\n]{0,25}(?:Section|S\.|s\.)\s*2\s*\(\s*[kl]\s*\)|(?:Section|S\.|s\.)\s*2\s*\(\s*i\s*\)[^.\n]{0,40}Data\s+Protection\s+Officer|(?:Section|S\.|s\.)\s*2\s*\(\s*j\s*\)[^.\n]{0,40}digital\s+office/i,
    message:
      'Section 2 lettering from the superseded Act file. In the Act: 2(t) "personal data", 2(u) "personal data breach", ' +
      '2(l) "Data Protection Officer", 2(m) "digital office", 2(r) "notification". Check dpdpa_2023_full_text.md.',
  },
  {
    pattern: /may\s+transfer\s+personal\s+data\s+of\s+a\s+Data\s+Principal\s+to\s+any\s+country/i,
    message:
      'Not the Act\'s wording (paraphrase from the superseded Act file). Section 16(1) reads: "The Central Government may, ' +
      'by notification, restrict the transfer of personal data by a Data Fiduciary for processing to such country or territory ' +
      'outside India as may be so notified." Quote that, or describe the negative-list model without quotation marks.',
  },
];
// END RULES
