import Header from "@/components/dashboard/Header";
import SpendingCheck from "@/components/dashboard/SpendingCheck";
import StatsGrid from "@/components/dashboard/StatsGrid";
import SummaryCard from "@/components/dashboard/SummaryCard";
import TopNav from "@/components/dashboard/TopNav";
import UpcomingPayments from "@/components/dashboard/UpcomingPayments";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50 px-5 py-6 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <TopNav />
        <Header />
        <SummaryCard safeToSpend="€482" currentBalance="€3,164" />
        <StatsGrid />

        <section className="grid gap-4 lg:grid-cols-2">
          <UpcomingPayments />
          <SpendingCheck />
        </section>
      </div>
    </main>
  );
}
