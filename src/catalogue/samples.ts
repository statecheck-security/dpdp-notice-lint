/**
 * Synthetic notices for the tests, the CLI's `--sample` flag and the website's "try a sample" buttons. Written by us; no
 * third-party notice is copied here. The company, addresses and links are made up.
 */

/** Every element present, so every element check is "found" and every review check "not found". */
export const SAMPLE_GOOD = `Privacy notice for the Example Grocer app

This notice is available in English, Hindi and Tamil. Use the language selector at the top of the app to switch.

What personal data we collect
- Your name
- Your email address
- Your mobile number
- Your delivery address
- Your date of birth, to confirm you are over 18 for alcohol orders
- Your order history
- Your UPI ID or card details, which our payment processor holds, not us
- Your device identifier and IP address when you use the app

Why we use it
- To deliver what you ordered to your address and to send you the invoice.
- To confirm your age before we sell age-restricted goods.
- To send you order updates by SMS and email.
- To answer your support requests.
- To keep the app secure and detect fraud.

Withdrawing your consent
You can withdraw your consent at any time from Settings > Privacy > Withdraw consent in the app, or by emailing privacy@example-grocer.in. Withdrawing is as easy as giving: one tap. After you withdraw, we stop processing your data within a reasonable time unless another law requires us to keep it.

Your rights
You can ask for access to the personal data we hold about you, ask us to correct or erase it, and nominate a person to exercise these rights for you if you are unable to. To do any of these, use the Privacy requests form in the app or write to privacy@example-grocer.in from the email address on your account. We answer requests and grievances within thirty days, within the published period under the Rules.

Questions and grievances
Our Grievance Officer answers questions about how we process your data. Email grievance@example-grocer.in or call +91 80 4000 0000.

Complaining to the Data Protection Board
If you are not satisfied with how we handled your grievance, you can make a complaint to the Data Protection Board of India through its website at https://www.dpb.gov.in/complaints.
`;

/**
 * The common misses in one notice: catch-all data and purposes, no withdrawal means, rights
 * deferred to the terms, no Board, consent bundled into use, English only, no grievance period.
 */
export const SAMPLE_BAD = `Privacy Policy

By using our website or services you agree to this Privacy Policy and consent to the collection and use of your information as described here.

We may collect information you provide to us and certain information automatically when you use the services. We use this information for business purposes, to improve our services and for any other purpose permitted by law.

We may share your information with our partners and affiliates as described in our Terms of Service, which govern your use of the services and your rights in relation to your information.

You may contact us with questions at support@example.com.
`;
