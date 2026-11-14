import { describe, expect, it } from 'vitest';
import { CATALOGUE_VERSION, CHECK_IDS, SAMPLE_BAD, SAMPLE_GOOD } from '../src/catalogue/index.js';
import { countWords, lintNotice, segment, toPlainText } from '../src/lint.js';
import type { LintResult } from '../src/lint.js';

const status = (result: LintResult, id: string) => result.results.find((r) => r.id === id)?.status;
const evidence = (result: LintResult, id: string) => result.results.find((r) => r.id === id)?.evidence ?? [];

describe('notice linter: shape', () => {
  it('returns one result per check, in catalogue order, stamped with the catalogue version', () => {
    const result = lintNotice(SAMPLE_GOOD);
    expect(result.results.map((r) => r.id)).toEqual([...CHECK_IDS]);
    expect(result.catalogueVersion).toBe(CATALOGUE_VERSION);
    for (const r of result.results) expect(['found', 'not_found', 'unclear']).toContain(r.status);
  });

  it('is deterministic', () => {
    expect(lintNotice(SAMPLE_BAD)).toEqual(lintNotice(SAMPLE_BAD));
    expect(lintNotice(SAMPLE_GOOD)).toEqual(lintNotice(SAMPLE_GOOD));
  });

  it('quotes evidence from the text at the offsets it reports, capped in length', () => {
    const result = lintNotice(SAMPLE_GOOD);
    for (const r of result.results) {
      expect(r.evidence.length).toBeLessThanOrEqual(3);
      for (const e of r.evidence) {
        expect(e.quote.length).toBeLessThanOrEqual(240);
        const span = result.text.slice(e.start, e.end);
        expect(e.quote.endsWith('…') ? span.startsWith(e.quote.slice(0, -1)) : span === e.quote).toBe(true);
      }
    }
  });
});

describe('notice linter: a notice with every element', () => {
  const result = lintNotice(SAMPLE_GOOD);

  it.each(['N1', 'N2', 'N3', 'N4', 'N5', 'N8', 'N9'])('%s is found', (id) => {
    expect(status(result, id)).toBe('found');
    expect(evidence(result, id).length).toBeGreaterThan(0);
  });

  it.each(['N6', 'N7', 'N10'])('%s raises nothing to review', (id) => {
    expect(status(result, id)).toBe('not_found');
  });

  it('quotes the data list for N1 and the Board sentence for N5', () => {
    expect(evidence(result, 'N1').some((e) => /mobile number|email address/i.test(e.quote))).toBe(true);
    expect(evidence(result, 'N5')[0]!.quote).toMatch(/Data Protection Board of India/);
  });
});

describe('notice linter: an empty notice', () => {
  it.each(['', '   \n\n', 'Privacy Policy'])(
    'says not found for every element and unclear where it would be a guess (%j)',
    (text) => {
      const result = lintNotice(text);
      for (const id of ['N1', 'N2', 'N3', 'N4', 'N5', 'N8']) expect(status(result, id), id).toBe('not_found');
      for (const id of ['N6', 'N7', 'N9', 'N10']) expect(status(result, id), id).toBe('unclear');
      for (const r of result.results) expect(r.evidence).toEqual([]);
    },
  );
});

describe('notice linter: the common misses', () => {
  const result = lintNotice(SAMPLE_BAD);

  it('N1: "information you provide" is not an itemised description', () => {
    expect(status(result, 'N1')).toBe('not_found');
    expect(evidence(result, 'N1')[0]!.quote).toMatch(/information you provide/i);
  });

  it('N2: "for business purposes" and "any other purpose" are not specified purposes', () => {
    expect(status(result, 'N2')).not.toBe('found');
    expect(evidence(result, 'N2').some((e) => /business purposes|any other purpose/i.test(e.quote))).toBe(true);
  });

  it('N3: no withdrawal', () => {
    expect(status(result, 'N3')).toBe('not_found');
  });

  it('N4: rights deferred to the terms are not found', () => {
    expect(status(result, 'N4')).not.toBe('found');
  });

  it('N5: no Board', () => {
    expect(status(result, 'N5')).toBe('not_found');
  });

  it('N6: "as described in our Terms of Service" for rights is a deferral', () => {
    expect(status(result, 'N6')).toBe('found');
    expect(evidence(result, 'N6')[0]!.quote).toMatch(/Terms of Service/);
  });

  it('N8: no language option', () => {
    expect(status(result, 'N8')).toBe('not_found');
  });

  it('N9: a support address without a role or period is not a grievance contact', () => {
    expect(status(result, 'N9')).toBe('not_found');
  });

  it('N10: "by using our website … you agree" is bundled consent', () => {
    expect(status(result, 'N10')).toBe('found');
    expect(evidence(result, 'N10')[0]!.quote).toMatch(/^By using our website/);
  });
});

describe('notice linter: per-check edges', () => {
  const PAD =
    'We run a grocery delivery service in Bengaluru. This paragraph is here so the text is long enough to judge. We deliver groceries every day of the week. Our riders use the app to find your door. We are a small company.';

  it('N1: a few items scattered in prose are unclear, a list of three or more is found', () => {
    const scattered = `${PAD} We will ask for your name when you register. Later we may ask for your phone.`;
    expect(status(lintNotice(scattered), 'N1')).toBe('unclear');
    const listed = `${PAD}\nWe collect:\n- your name\n- your email address\n- your delivery address\n`;
    expect(status(lintNotice(listed), 'N1')).toBe('found');
    const inline = `${PAD} We collect the following personal data: your name, email address, mobile number and delivery address.`;
    expect(status(lintNotice(inline), 'N1')).toBe('found');
  });

  it('N2: two purposes under a "How we use" heading are found; one purpose alone is unclear', () => {
    const sectioned = `${PAD}\nHow we use your data\n- To deliver your order to your address.\n- To send you the invoice by email.\n`;
    expect(status(lintNotice(sectioned), 'N2')).toBe('found');
    const single = `${PAD} We use your address to deliver your order.`;
    expect(status(lintNotice(single), 'N2')).toBe('unclear');
  });

  it('N3: withdrawal without a means is unclear; a link in the same paragraph makes it found', () => {
    const noMeans = `${PAD} You may withdraw your consent at any time.`;
    expect(status(lintNotice(noMeans), 'N3')).toBe('unclear');
    const withLink = `${PAD}\nYou may withdraw your consent at any time. Go to https://example.in/privacy/withdraw or email privacy@example.in.`;
    expect(status(lintNotice(withLink), 'N3')).toBe('found');
    const optOut = `${PAD} You can opt out of marketing emails using the unsubscribe link.`;
    expect(status(lintNotice(optOut), 'N3')).toBe('unclear');
  });

  it('N4: three rights with a form are found; rights with no means are unclear', () => {
    const withForm = `${PAD}\nYou have the right to access, correct and erase your personal data, and to nominate someone to act for you. Use the Privacy requests form in your account settings.`;
    expect(status(lintNotice(withForm), 'N4')).toBe('found');
    const noMeans = `${PAD}\nYou have the right to access, correct and erase your personal data.`;
    expect(status(lintNotice(noMeans), 'N4')).toBe('unclear');
    const oneRight = `${PAD}\nYou can ask us to delete your account by writing to us.`;
    expect(status(lintNotice(oneRight), 'N4')).toBe('unclear');
  });

  it('N5: the Board without a complaint means is unclear; a Board of Directors is not the Board', () => {
    const noMeans = `${PAD} You may also approach the Data Protection Board of India.`;
    expect(status(lintNotice(noMeans), 'N5')).toBe('unclear');
    const directors = `${PAD} Our Board of Directors reviews this policy every year.`;
    expect(status(lintNotice(directors), 'N5')).toBe('not_found');
    const withLink = `${PAD}\nYou may complain to the Data Protection Board of India. The Board's complaint portal is at https://dpb.example/complaints.`;
    expect(status(lintNotice(withLink), 'N5')).toBe('found');
  });

  it('N6: a reference to the terms that touches no required element is unclear', () => {
    const loose = `${PAD} Delivery times are as set out in our Terms of Service.`;
    expect(status(lintNotice(loose), 'N6')).toBe('unclear');
    const tied = `${PAD} How to withdraw your consent is explained in our Terms of Service.`;
    expect(status(lintNotice(tied), 'N6')).toBe('found');
  });

  it('N7: a wall of long passive sentences is flagged with the longest quoted', () => {
    const long = Array.from(
      { length: 6 },
      () =>
        'Personal data which has been provided by the user is retained by the company for such period as is considered necessary by the company for the purposes for which it was collected and such other purposes as are permitted by applicable law from time to time.',
    ).join(' ');
    const r = lintNotice(long);
    expect(status(r, 'N7')).toBe('found');
    expect(evidence(r, 'N7')[0]!.quote).toMatch(/^Personal data which has been provided/);
    expect(status(lintNotice(`${PAD} We keep sentences short.`), 'N7')).toBe('not_found');
  });

  it('N8: an offer in English alone is found (S.5(3)); a language named without an offer is unclear', () => {
    expect(status(lintNotice(`${PAD} This notice is provided in English.`), 'N8')).toBe('found');
    expect(status(lintNotice(`${PAD} This notice is written in English.`), 'N8')).toBe('unclear');
    expect(status(lintNotice(`${PAD} Our support team speaks Hindi.`), 'N8')).toBe('unclear');
    expect(
      status(lintNotice(`${PAD} You can read this notice in Hindi or Kannada using the language selector.`), 'N8'),
    ).toBe('found');
  });

  it('N9: contact alone or period alone is unclear', () => {
    expect(status(lintNotice(`${PAD}\nOur Grievance Officer can be reached at grievance@example.in.`), 'N9')).toBe(
      'unclear',
    );
    expect(status(lintNotice(`${PAD} We respond to grievances within 30 days.`), 'N9')).toBe('unclear');
    expect(
      status(
        lintNotice(
          `${PAD}\nOur Grievance Officer can be reached at grievance@example.in. We respond to grievances within 30 days.`,
        ),
        'N9',
      ),
    ).toBe('found');
  });

  it('N10: agreeing to the policy as a whole is unclear; "continued use" is found', () => {
    expect(status(lintNotice(`${PAD} You agree to this Privacy Policy.`), 'N10')).toBe('unclear');
    expect(status(lintNotice(`${PAD} Your continued use of the app will be treated as your consent.`), 'N10')).toBe(
      'found',
    );
  });
});

describe('notice linter: text preparation', () => {
  it('strips HTML, keeping paragraphs and list items as lines', () => {
    const html =
      '<h2>What we collect</h2><ul><li>Your name</li><li>Your &amp; email address</li></ul><p>We use it to deliver.</p><script>x()</script>';
    expect(toPlainText(html)).toBe('What we collect\n\n- Your name\n- Your & email address\n\nWe use it to deliver.');
    const r = lintNotice(html);
    expect(r.text).not.toMatch(/</);
  });

  it('segments headings, list items and sentences with offsets', () => {
    const text = 'Your rights\nYou can ask. We will reply!\n- First item\n';
    const units = segment(text);
    expect(units.map((u) => [u.text, u.heading, u.listItem, u.block])).toEqual([
      ['Your rights', true, false, 0],
      ['You can ask.', false, false, 1],
      ['We will reply!', false, false, 1],
      ['- First item', false, true, 2],
    ]);
    for (const u of units) expect(text.slice(u.start, u.end)).toBe(u.text);
  });

  it('counts words', () => {
    expect(countWords('one two  three\n- four')).toBe(4);
    expect(countWords('')).toBe(0);
  });
});
