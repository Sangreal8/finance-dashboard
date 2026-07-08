import StatCard from "./StatCard";

const stats = [
  { title: "Bills remaining", value: "€1,235" },
  { title: "Savings planned", value: "€250" },
  { title: "Discretionary spent", value: "41%" },
];

export default function StatsGrid() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <StatCard key={stat.title} title={stat.title} value={stat.value} />
      ))}
    </section>
  );
}
