import type {
  Allocation,
  ForecastItem,
  MonthlyPlan,
  PlannedCommitment,
  Reserve,
} from "./types";

function commitmentToAllocation(
  commitment: PlannedCommitment
): Allocation {
  return {
    id: `commitment-${commitment.id}`,
    sourceId: commitment.id,
    name: commitment.name,
    amount: commitment.amount,
    type: commitment.type,
    source: "commitment",
    confidence: commitment.confidence,
    dueDate: commitment.dueDate,
    mandatory: commitment.mandatory,
  };
}

function forecastItemToAllocation(
  item: ForecastItem
): Allocation {
  return {
    id: `forecast-${item.id}`,
    sourceId: item.id,
    name: item.name,
    amount: item.amount,
    type: item.type,
    source: "forecast",
    confidence: item.confidence,
    mandatory: item.confidence !== "optional",
  };
}

function reserveToAllocation(
  reserve: Reserve
): Allocation {
  return {
    id: `reserve-${reserve.id}`,
    sourceId: reserve.id,
    name: reserve.name,
    amount: reserve.amount,
    type: reserve.type,
    source: "reserve",
    confidence: reserve.confidence,
    dueDate: reserve.dueDate,
    mandatory: reserve.mandatory,
  };
}

export function buildAllocations(
  plan: MonthlyPlan,
  reserves: Reserve[] = []
): Allocation[] {
  const commitmentAllocations = plan.commitments
    .filter(
      (commitment) =>
        commitment.mandatory &&
        commitment.status !== "paid" &&
        commitment.status !== "cancelled"
    )
    .map(commitmentToAllocation);

  const forecastAllocations = plan.forecastItems
    .filter((item) => item.confidence !== "optional")
    .map(forecastItemToAllocation);

  const reserveAllocations = reserves
    .filter(
      (reserve) =>
        reserve.active &&
        reserve.reserved
    )
    .map(reserveToAllocation);

  return [
    ...commitmentAllocations,
    ...forecastAllocations,
    ...reserveAllocations,
  ];
}

export function getAllocatedCash(
  allocations: Allocation[]
): number {
  return allocations.reduce(
    (total, allocation) =>
      total + allocation.amount,
    0
  );
}