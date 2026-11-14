# Security policy

## What this tool handles

dpdp-notice-lint reads privacy notices. A notice is usually public, but a draft one may name
people, addresses or internal systems. The tool's first duty is not to move that text anywhere.

- The engine is a pure function: no network request, no file written, no storage.
- The CLI reads the file or stdin you give it and writes the report you asked for, nothing else.
- Evidence quotes are capped at 240 characters and come only from the text you supplied.
- The web page that uses this engine runs it in the visitor's browser; the notice never reaches
  a server.

If you find a code path that sends or stores notice text, treat it as a security bug and report
it as below, not as a public issue.

## Reporting a vulnerability

Use the contact form at <https://statechecksecurity.com/#contact> (or the email address
published there) with the version, the input shape that triggers the problem (a synthetic notice,
please) and the output you saw. We acknowledge within three working days.

Do not open a public issue for a leak, and do not attach a real company's draft notice to any
report.

## Supported versions

Only the latest release on npm receives fixes.
