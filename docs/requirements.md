# ACME Salary Management — MVP Requirements

**Version:** 1.0 | **Date:** 17 October 2026 | **Primary user:** HR Manager

## Goal and problem
ACME's HR team currently manages compensation for 10,000 employees across multiple countries using spreadsheets. Deliver a secure, usable web application that makes employee salary records easy to maintain and helps HR answer common compensation questions.

## In scope (MVP)
- **Employee directory:** View, create, and edit employee records; search by name or employee ID; filter by country and department; paginate results.
- **Salary management:** Record and update annual base salary, currency, and effective date. Validate amounts and retain an auditable history of salary changes.
- **Compensation reporting:** Show employee counts, average salaries, and payroll totals grouped by country, currency, and department; avoid adding amounts in different currencies.
- **HR access:** Authenticate HR users and authorize access to sensitive salary records.
- **Seed data:** Provide a repeatable script generating 10,000 realistic, synthetic employee records across several countries.

## Acceptance criteria
1. An authorized HR user can locate an employee, inspect compensation, update salary, and see the change in salary history.
2. The directory supports server-side search, filters, and pagination with 10,000 seeded records.
3. Reports calculate accurate totals and averages within each currency; no misleading cross-currency totals are shown.
4. Invalid salary updates are rejected with actionable errors; salary and history writes are atomic.
5. Backend and React UI work end-to-end in a deployed environment; a demo video and setup instructions are provided.
6. Automated tests cover core salary rules, permissions, employee queries, and analytics.

## Non-functional expectations
Use a maintainable Python/Django REST Framework backend, React frontend, and relational database. Store monetary values with decimal precision. Enforce server-side validation, least-privilege access, and database consistency. Use indexed queries, pagination, and database-side aggregation for responsive handling of 10,000 employees. Seed only fictional data and keep secrets out of Git.

## Deliberately out of scope (and why)
- **Payroll execution, taxation, deductions, benefits:** Country-specific compliance and payments would distract from the core salary-data workflow.
- **Live exchange-rate conversion and global consolidated payroll:** Requires exchange-rate sources and accounting policies; initial reporting stays currency-specific.
- **Multi-stage approvals and advanced HR roles:** One HR Manager persona is specified; these workflows can be added later.
- **AI chatbot, predictions, and compensation recommendations:** Not required to answer the chosen reporting questions; conventional analytics is more transparent and testable.
- **Complex integrations and bulk spreadsheet migration:** Valuable later, but not essential to demonstrate the core product within the assessment timeframe.

## Delivery evidence
Commit this requirements document before implementation, then build incrementally with meaningful Git commits. Include tests, architecture/trade-off notes, representative AI usage, a working deployment, and a video demonstration.
