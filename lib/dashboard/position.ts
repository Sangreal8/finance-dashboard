import type { FinancialStatus } from "./status";

export interface FinancialPosition {
  currentCash: number;
  committedOutgoing: number;
  expectedIncoming: number;
  cashAfterCommitments: number;
  projectedBalance: number;
  emergencyBuffer: number;
  availableBeforePayday: number;
  financialStatus: FinancialStatus;
}

interface BuildFinancialPositionArgs {
  currentCash: number;
  committedOutgoing: number;
  expectedIncoming: number;
  financialStatus: FinancialStatus;
  emergencyBuffer?: number;
}

export function buildFinancialPosition({
  currentCash,
  committedOutgoing,
  expectedIncoming,
  financialStatus,
  emergencyBuffer = 250,
}: BuildFinancialPositionArgs): FinancialPosition {
  const cashAfterCommitments = currentCash - committedOutgoing;
  const projectedBalance = cashAfterCommitments + expectedIncoming;

  const availableBeforePayday = Math.max(
    0,
    cashAfterCommitments - emergencyBuffer
  );

  return {
    currentCash,
    committedOutgoing,
    expectedIncoming,
    cashAfterCommitments,
    projectedBalance,
    emergencyBuffer,
    availableBeforePayday,
    financialStatus,
  };
}