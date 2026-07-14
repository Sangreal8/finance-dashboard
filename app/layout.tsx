import type { Metadata } from "next";
import TopNav from "@/components/dashboard/TopNav";
import { ContentContainer } from "@/components/ui/ContentContainer";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen bg-zinc-50 text-zinc-950">
        <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(244,244,245,0.9))] px-4 py-4 text-zinc-950 sm:px-6 lg:px-8 lg:py-6">
          <ContentContainer className="flex flex-col gap-4">
            <TopNav />
            <div className="pb-8">{children}</div>
          </ContentContainer>
        </main>
      </body>
    </html>
  );
}
