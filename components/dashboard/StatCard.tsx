type StatCardProps = {
  title: string;
  value: string;
};

export default function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{title}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}
