export type CategoryGroup =
  | "Income"
  | "Bills"
  | "Needs"
  | "Subscriptions"
  | "Misc"
  | "Robin"
  | "Savings"
  | "Debt"
  | "Lifestyle"
  | "Legal";

export type Category = {
  id: string;
  name: string;
  group: CategoryGroup;
};