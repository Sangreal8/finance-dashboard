# Finance Dashboard

Finance Dashboard is a personal finance prototype built with Next.js, React, TypeScript, and Tailwind CSS. The project is currently a data-driven demo application for exploring monthly cash flow, planned commitments, and simple transaction matching rather than a full banking product.

## What this project is

The application aims to help a single user understand whether their upcoming commitments and expected income leave enough room to spend safely during a month. The current experience is centered on a dashboard that shows:

- available cash today
- mandatory commitments due this month
- a simple safe-to-spend estimate
- projected month-end cash
- a timeline of upcoming income and commitments

The implementation uses local TypeScript data modules under the data folder rather than a database or external API.

## The overall philosophy

This project is intentionally practical and conservative:

- keep the financial logic explicit and easy to inspect
- separate business rules from presentation
- favor deterministic calculations over hidden state
- make the current month easy to reason about before adding more automation

The UI is designed as a command center for planning, not as a full accounting platform.

## Finance Engine architecture

The core of the project is the finance engine in the lib/finance layer. It is responsible for turning raw data into a monthly financial picture.

At a high level:

- data modules define accounts, recurring commitments, transactions, and a monthly plan
- the engine builds a financial position and a timeline of events
- the UI consumes those outputs through page-level components

The main modules are:

- lib/finance/engine.ts: entry points for the dashboard view
- lib/finance/planner.ts: builds the timeline of commitments and income events
- lib/finance/recurring.ts: generates month-specific planned commitments from recurring definitions
- lib/finance/matcher.ts: matches transactions to planned commitments
- lib/finance/position.ts: computes available cash and projected outcomes
- lib/finance/status.ts: translates the calculations into health states
- lib/finance/types.ts: shared domain model

## Current implemented features

Implemented in the current repository snapshot:

- dashboard landing page with a financial snapshot and upcoming timeline
- monthly cash-flow calculations based on available accounts, mandatory commitments, forecast spending, income, and a safety buffer
- recurring commitment generation for monthly, quarterly, and yearly schedules
- simple transaction matching for planned commitments using amount, date proximity, and merchant patterns
- transactions page with a table view and an add-transaction dialog UI
- budget overview page that summarizes planned budget items for a specific month
- goals page placeholder for future work

## Project structure

- app/: Next.js App Router pages and layouts
- components/: UI components grouped by feature area
- data/: static data used to drive the current prototype
- lib/: shared calculations and finance engine modules
- types/: domain types for transactions and budget data
- public/: static assets

## Getting started

Requirements:

- Node.js 20+
- npm

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Then open http://localhost:3000.

Useful commands:

```bash
npm run build
npm run lint
```

## Roadmap

Implemented now:

- Dashboard MVP
- Cash Flow Prototype
- Finance Engine Foundation
- Recurring Commitments
- Transaction Matching

Planned next:

- persistent storage instead of static demo data
- real bank or account synchronization
- editable transactions and commitments
- richer budget and goal workflows
- more detailed forecasting and scenario analysis

## Design principles

- keep calculations transparent and testable
- prefer small, composable modules over large coupled services
- separate domain rules from UI rendering
- make the current data model explicit so new features can be added incrementally
- treat the app as a planning tool first and a bookkeeping system second

For more detail, see docs/ARCHITECTURE.md and docs/CHANGELOG.md.
