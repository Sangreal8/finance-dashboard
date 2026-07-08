import type { Category } from "@/types/category";

export const categories: Category[] = [
  { id: "salary", name: "Salary", group: "Income" },

  { id: "mortgage", name: "Mortgage", group: "Bills" },
  { id: "electricity", name: "Electricity", group: "Bills" },
  { id: "bins", name: "Bins", group: "Bills" },
  { id: "internet", name: "Internet", group: "Bills" },
  { id: "home-insurance", name: "Home Insurance", group: "Bills" },
  { id: "property-tax", name: "Property Tax", group: "Bills" },
  { id: "mortgage-protection", name: "Mortgage Protection", group: "Bills" },
  { id: "phone", name: "Phone", group: "Bills" },
  { id: "couch", name: "Couch", group: "Bills" },

  { id: "groceries", name: "Groceries", group: "Needs" },
  { id: "haircuts", name: "Haircuts", group: "Needs" },
  { id: "petrol", name: "Petrol", group: "Needs" },
  { id: "therapy", name: "Therapy", group: "Needs" },

  { id: "netflix", name: "Netflix", group: "Subscriptions" },
  { id: "google-workspace", name: "Google Workspace", group: "Subscriptions" },
  { id: "google-one", name: "Google One", group: "Subscriptions" },
  { id: "apple-tv", name: "Apple TV", group: "Subscriptions" },
  { id: "prime", name: "Prime", group: "Subscriptions" },
  { id: "pyimagesearch", name: "PyImageSearch", group: "Subscriptions" },
  { id: "youtube-premium", name: "YouTube Premium", group: "Subscriptions" },

  { id: "eflow", name: "eFlow", group: "Misc" },

  { id: "robin-maintenance", name: "Robin Maintenance", group: "Robin" },
  { id: "robin-nursery", name: "Robin Nursery", group: "Robin" },
  { id: "robin-travel", name: "Robin Travel", group: "Robin" },

  { id: "legal-fees", name: "Legal Fees", group: "Legal" },

  { id: "emergency-fund", name: "Emergency Fund", group: "Savings" },
  { id: "holiday", name: "Holiday", group: "Savings" },
  { id: "credit-card", name: "Credit Card", group: "Debt" },

  { id: "eating-out", name: "Eating Out", group: "Lifestyle" },
  { id: "shopping", name: "Shopping", group: "Lifestyle" },
  { id: "coffee", name: "Coffee", group: "Lifestyle" },
];