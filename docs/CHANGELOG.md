# Changelog

All notable changes to this project are documented here. This repository is still a prototype, so the changelog focuses on the milestones that are visible in the current codebase rather than a long product history.

## [Unreleased]

### Documentation

- Added repository documentation covering the README, architecture, and changelog.

## Dashboard MVP

### Added

- A dashboard landing page showing a financial snapshot and a timeline of upcoming events.
- A simple top navigation between Today, Transactions, Budget, and Goals.
- UI cards and sections for available cash, known commitments, safe-to-spend, and projected month-end balance.

## Cash Flow Prototype

### Added

- Monthly cash-flow calculations based on account balances, mandatory commitments, forecast spending, income, and a safety buffer.
- A financial health status summary that classifies the month as healthy, warning, or critical.
- A timeline showing the effect of income and commitments on running balance.

## Finance Engine Foundation

### Added

- A finance engine module under lib/finance with typed domain objects for accounts, commitments, income, forecast items, monthly plans, and financial positions.
- Core calculation logic for available cash and projected month-end balance.
- Explicit financial rules such as safe-to-spend flooring and the exclusion of non-eligible accounts from available cash.

## Recurring Commitments

### Added

- A recurring commitment model with support for monthly, quarterly, and yearly schedules.
- Logic that expands recurring commitments into a month-specific planned commitment set.
- Support for start and end dates, mandatory flags, due days, and confidence levels.

## Transaction Matching

### Added

- A matcher that links planned commitments to transactions using amount, date proximity, and merchant-pattern matching.
- Status updates for planned commitments that become matched or paid based on transaction data.
- A sample transaction dataset used to demonstrate the matching behavior.
