const upcomingPayments = [
  { name: "Mortgage", date: "Tomorrow", amount: "€903" },
  { name: "Electricity", date: "12 Jul", amount: "€86" },
  { name: "Gym", date: "15 Jul", amount: "€45" },
];

export default function UpcomingPayments() {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-lg font-semibold tracking-tight">Upcoming</h2>

      <div className="mt-4 divide-y divide-neutral-100 dark:divide-neutral-800">
        {upcomingPayments.map((payment) => (
          <div
            key={payment.name}
            className="flex items-center justify-between py-4"
          >
            <div>
              <p className="font-medium">{payment.name}</p>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {payment.date}
              </p>
            </div>
            <p className="font-semibold">{payment.amount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
