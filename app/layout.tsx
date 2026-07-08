import type { Metadata } from "next";
import TopNav from "@/components/dashboard/TopNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finance Dashboard",
  description: "Personal finance command centre",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-neutral-50 px-5 py-6 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
          <div className="mx-auto flex max-w-5xl flex-col gap-6">
            <TopNav />
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
