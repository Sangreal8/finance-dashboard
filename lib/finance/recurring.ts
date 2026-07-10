import type {
  PlannedCommitment,
  RecurringCommitment,
} from "./types";

function getMonthStart(month: string) {
  return new Date(`${month}-01T12:00:00`);
}

function getMonthEnd(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);

  return new Date(year, monthNumber, 0, 12);
}

function buildDate(month: string, day: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDayOfMonth = new Date(year, monthNumber, 0).getDate();
  const safeDay = Math.min(Math.max(day, 1), lastDayOfMonth);

  return `${month}-${String(safeDay).padStart(2, "0")}`;
}

function isCommitmentActiveForMonth(
  commitment: RecurringCommitment,
  month: string
) {
  if (!commitment.active) {
    return false;
  }

  const monthStart = getMonthStart(month);
  const monthEnd = getMonthEnd(month);
  const startsOn = new Date(`${commitment.startsOn}T12:00:00`);

  if (startsOn > monthEnd) {
    return false;
  }

  if (commitment.endsOn) {
    const endsOn = new Date(`${commitment.endsOn}T12:00:00`);

    if (endsOn < monthStart) {
      return false;
    }
  }

  return true;
}

function shouldGenerateForMonth(
  commitment: RecurringCommitment,
  month: string
) {
  if (!isCommitmentActiveForMonth(commitment, month)) {
    return false;
  }

  const [targetYear, targetMonth] = month.split("-").map(Number);
  const startDate = new Date(`${commitment.startsOn}T12:00:00`);

  const monthsSinceStart =
    (targetYear - startDate.getFullYear()) * 12 +
    (targetMonth - (startDate.getMonth() + 1));

  if (monthsSinceStart < 0) {
    return false;
  }

  switch (commitment.frequency) {
    case "monthly":
      return true;
    case "quarterly":
      return monthsSinceStart % 3 === 0;
    case "yearly":
      return monthsSinceStart % 12 === 0;
    case "weekly":
      return false;
  }
}

export function generateCommitmentsForMonth(
  commitments: RecurringCommitment[],
  month: string
): PlannedCommitment[] {
  return commitments
    .filter((commitment) => shouldGenerateForMonth(commitment, month))
    .map((commitment): PlannedCommitment => {
      return {
        id: `${commitment.id}-${month}`,
        recurringCommitmentId: commitment.id,
        name: commitment.name,
        amount: commitment.amount,
        type: commitment.type,
        dueDate: buildDate(month, commitment.dueDay ?? 1),
        mandatory: commitment.mandatory,
        confidence: commitment.confidence,
        status: "planned",
        paymentAccountId: commitment.paymentAccountId,
        merchantPatterns: commitment.merchantPatterns,
      };
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}