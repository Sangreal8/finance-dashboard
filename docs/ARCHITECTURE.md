# Architecture

## Overview

Finance Dashboard is a thin, data-driven application for modeling a monthly personal finance picture. It is organized as a layered system:

1. presentation layer
2. application/domain layer
3. data layer

The presentation layer is the Next.js App Router UI in app/ and the React components in components/. The application/domain layer is the finance engine in lib/finance/. The data layer is the static TypeScript data module set under data/.

## Layered architecture

### Presentation layer

The presentation layer renders the current month view, transaction list, budget overview, and placeholder goals screen. Pages are defined under app/ and are intentionally lightweight. They retrieve data from finance-engine entry points and pass the result to UI components.

Examples:

- app/page.tsx renders the dashboard snapshot and timeline
- app/transactions/page.tsx renders the transaction list page
- app/budget/page.tsx renders the budget overview page

### Application and domain layer

The domain layer contains the finance engine, which is the heart of the repository. It defines how recurring obligations become planned commitments, how transactions are matched, and how a financial position is calculated.

The core modules are:

- lib/finance/engine.ts: public entry points for the dashboard data
- lib/finance/recurring.ts: recurring commitment expansion
- lib/finance/matcher.ts: transaction matching logic
- lib/finance/position.ts: cash and month-end calculations
- lib/finance/planner.ts: timeline construction
- lib/finance/status.ts: status classification
- lib/finance/types.ts: shared domain model

### Data layer

The current implementation uses static TypeScript data files rather than a database or network service. These files provide the sample state used by the app:

- data/accounts.ts
- data/recurringCommitments.ts
- data/transactions.ts
- data/monthlyPlan.ts
- data/budgetItems.ts
- data/categories.ts

## The Finance Engine

The Finance Engine is not a separate service. It is a library-style set of functions that transform the current dataset into the information the UI needs.

Its responsibilities are:

- generate a monthly plan from recurring commitments
- match transactions to planned commitments
- compute cash-flow health and safe-to-spend metrics
- build a timeline of expected events and balances

The engine is intentionally deterministic. Given the same accounts, commitments, transactions, and monthly inputs, it produces the same results.

## Data flow

The main flow for the dashboard is:

1. the app imports data from the static source modules
2. the engine entry point gathers accounts and the monthly plan
3. finance calculations are applied to produce a financial position and timeline
4. the UI renders those outputs in the dashboard components

The flow for recurring commitments is:

1. recurring commitments are defined in data/recurringCommitments.ts
2. the recurring generator expands them for a target month
3. the matcher evaluates transactions against those planned commitments
4. a monthly plan is created with a mix of planned, matched, and paid commitments

## Domain model

The domain model is centered on a small set of concepts:

- Account: a tracked financial account with currency and balance
- RecurringCommitment: a reusable obligation definition
- PlannedCommitment: a generated commitment for a specific month
- IncomeItem: an expected inflow for the month
- ForecastItem: a non-committed estimate for future spending
- MonthlyPlan: the bundle of commitments, income, and forecast items for a month
- FinancialPosition: the derived snapshot that drives the dashboard
- FinanceTimelineEvent: a single event on the cash-flow timeline

## Recurring commitments

Recurring commitments are generated from definitions that include:

- name and amount
- amount strategy metadata
- commitment type
- frequency (monthly, quarterly, yearly)
- active window with startsOn/endsOn dates
- due day
- mandatory flag
- confidence level
- optional merchant patterns used for matching

The generator in lib/finance/recurring.ts creates a PlannedCommitment for each active recurring commitment that should appear in the target month.

## Planned commitments

Planned commitments are month-specific and can move through the following statuses:

- planned
- matched
- paid
- missed
- cancelled

The current matching process can change a planned commitment into matched or paid based on the transaction data.

## Transaction matching

The transaction matching logic in lib/finance/matcher.ts tries to link an expense transaction to a planned commitment when all of the following are true:

- the transaction is an expense
- the transaction amount closely matches the commitment amount
- the transaction date is within five days of the commitment due date
- the description includes a merchant pattern or the commitment name

Each planned commitment can be matched to at most one transaction, and matched transactions are not reused.

## Financial position calculation

The financial position is calculated in lib/finance/position.ts and combines the following inputs:

- available cash from eligible accounts
- mandatory unpaid commitments
- estimated remaining spending from forecast items
- expected income for the month
- a configured safety buffer

The resulting metrics are:

- availableToday
- knownCommitments
- estimatedRemainingSpend
- safetyBuffer
- safeToSpend
- expectedIncome
- projectedMonthEnd
- financialStatus

The safe-to-spend value is bounded at zero, which prevents the app from providing a negative spending allowance.

## Financial integrity rules

The current engine uses a small set of explicit rules to keep the financial picture coherent:

- only accounts marked as includeInAvailableCash and using EUR are included in available cash
- credit cards are excluded from available cash calculations
- only mandatory, unpaid, or not-cancelled commitments contribute to known commitments
- forecast items marked as optional do not count toward the estimated remaining spend
- the app reports a health status based on the combination of safe-to-spend and projected month-end cash

These rules are simple and visible in the code, which makes them easy to evolve.

## How to extend the system

The current architecture is intentionally modular, so new features can be added without rewriting the whole app.

Potential extension points:

- add persistence in data/ or a future services layer and keep the finance engine interface stable
- introduce a repository layer for accounts, commitments, and transactions
- add scenario modeling by allowing multiple monthly plans or alternative assumptions
- expand the matching engine to use richer rules such as account, category, or recurrence history
- add new UI views that consume the same engine outputs

When adding new behavior, keep the rule logic in lib/finance and keep the UI focused on presentation.
