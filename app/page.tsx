import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { connection } from "next/server";
import {
  getFinancialPosition,
  getFinanceTimeline,
  getReserves,
} from "@/lib/finance/engine";

export default async function DashboardPage() {
  await connection();

  const referenceDate = new Date();

  return (
    <DashboardClient
      initialPosition={getFinancialPosition(referenceDate)}
      initialTimeline={getFinanceTimeline(referenceDate)}
      reserves={getReserves(referenceDate)}
    />
  );
}
