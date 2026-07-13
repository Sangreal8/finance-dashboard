import { DashboardClient } from "@/components/dashboard/DashboardClient";
import {
  getFinancialPosition,
  getFinanceTimeline,
  getReserves,
} from "@/lib/finance/engine";

export default function DashboardPage() {
  return (
    <DashboardClient
      initialPosition={getFinancialPosition()}
      initialTimeline={getFinanceTimeline()}
      reserves={getReserves()}
    />
  );
}
