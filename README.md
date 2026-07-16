# Finance Dashboard

A modern, minimalist personal finance dashboard built to answer one simple question:

> **Am I financially okay this month?**

This project is **not** intended to replace online banking or accounting software.

Instead, it acts as a personal financial command centre that combines imported bank transactions, planned commitments and live account balances into a calm, trustworthy picture of where your finances stand today.

---

## Philosophy

Inspired by products such as:

- Linear
- Monzo
- Apple Wallet
- Raycast
- Notion

The emphasis is on clarity rather than accounting.

The dashboard focuses on:

- current cash position
- upcoming bills
- remaining disposable income
- financial confidence
- planning ahead

instead of complex bookkeeping.

---

# Current Status

## ✅ Version 1.0

The dashboard is now fully usable for day-to-day personal finance management.

Current workflow:

1. Import latest AIB transactions
2. Import latest Revolut statement
3. Confirm today's account balances
4. Review upcoming commitments
5. Instantly see:
   - Available today
   - Safe to Spend
   - Daily Budget
   - Remaining commitments

The dashboard now provides a reliable picture of the current month's finances without requiring manual spreadsheet calculations.

---

# Features

## Dashboard

Shows:

- Available Today
- Known Commitments
- Safe to Spend
- Daily Budget

with a transparent calculation explaining exactly how the figures are produced.

---

## Transaction Import

Supports:

### AIB

- CSV transaction imports
- overlapping imports
- duplicate detection
- historical imports
- statement balance extraction

### Revolut

- XLSX statement imports
- duplicate detection
- balance extraction

Imports are cumulative and preserve historical transactions.

---

## Current Balance Confirmation

One of the biggest limitations of bank exports is that they are already out of date when downloaded.

The dashboard solves this by allowing today's balance to be confirmed manually.

Example:

Statement:

€893.72

Current app balance:

€185.55

The dashboard understands that activity has happened since the export without inventing missing transactions.

Overrides are temporary and automatically become unnecessary after the next import catches up.

---

## Merchant Recognition

Transactions are automatically recognised where possible.

Examples:

- Tesco
- Amazon
- Google
- Netflix
- Revolut
- AIB
- Sky
- Insurance
- Utilities

Unknown merchants remain visible for future teaching.

---

## Commitment Planning

The finance engine understands:

### Paid

Already completed.

### Upcoming

Expected before payday.

### Future Plans

Visible but not yet reducing available spending.

### Fulfilled

Historical commitments retained for context.

---

## Safe to Spend

The dashboard calculates:

```
Current balances

minus

Remaining commitments

minus

Reserved money

minus

Safety buffer

=

Safe to Spend
```

Every figure is fully explainable.

---

## Daily Budget

Safe to Spend is divided across the remaining days until payday to provide a realistic daily spending target.

---

## Reserve Management

Money can be reserved for planned costs.

Examples:

- solicitor fees
- holidays
- home improvements
- car servicing

Once a reserve has been fulfilled it no longer reduces available spending while remaining visible for historical context.

---

## Import Intelligence

The import engine supports:

- overlapping exports
- historical exports
- duplicate detection
- transaction normalisation
- merchant enrichment
- balance extraction

Repeated imports never duplicate transactions.

---

# Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- React
- LocalStorage persistence

Current version is entirely client-side.

Future versions will migrate to Supabase.

---

# Project Structure

```
app/
components/
lib/
  finance/
  import/
  planning/
  merchants/
data/
docs/
```

---

# Roadmap

## Version 1.1

Focus on reducing manual maintenance.

Planned improvements include:

- Better merchant teaching
- Planned transaction support
- Pending transaction awareness
- Improved forecasting
- Automatic commitment learning

---

## Version 2

Move towards automation.

Planned:

- Supabase backend
- User accounts
- Multi-device sync
- Connected banking (GoCardless/Nordigen)
- Automatic transaction refresh

---

## Version 3

Long-term vision.

- Native mobile app
- Push notifications
- Budget forecasting
- Cash-flow timeline
- Goal tracking
- AI financial assistant

---

# Design Principles

Every feature should answer one of these questions:

- Am I financially okay?
- What still needs to be paid?
- How much can I safely spend?
- What changed since yesterday?
- What should I pay attention to?

If a feature doesn't improve those answers, it probably doesn't belong.

---

# Current Limitations

The dashboard intentionally does **not** yet include:

- live banking connections
- automatic transaction sync
- recurring merchant learning
- investment tracking
- accounting reports
- tax calculations

These are outside the scope of Version 1.

---

# Vision

This project aims to become a calm, intelligent financial command centre rather than another budgeting app.

The goal is that opening the dashboard for five seconds should immediately tell you:

> **"You're okay."**

or

> **"Be careful for the next few days."**

without needing to inspect dozens of transactions or log into multiple banking apps.
