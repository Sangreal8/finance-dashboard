import Header from "@/components/dashboard/Header";
import SpendingCheck from "@/components/dashboard/SpendingCheck";
import StatsGrid from "@/components/dashboard/StatsGrid";
import SummaryCard from "@/components/dashboard/SummaryCard";
import UpcomingPayments from "@/components/dashboard/UpcomingPayments";

export default function Home() {
  return (
    <>
      <Header />
      <SummaryCard safeToSpend="€482" currentBalance="€3,164" />
      <StatsGrid />

      <section className="grid gap-4 lg:grid-cols-2">
        <UpcomingPayments />
        <SpendingCheck />
      </section>
    </>
  );
}
