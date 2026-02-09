import type { Metadata } from "next";
import "./globals.css";
import { FinanceProvider } from "@/lib/finance-context";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Personal Finance App - Australian Household Finance Calculator",
  description: "ATO-accurate income tax, superannuation, and expense distribution calculator for Australian households",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-cream">
        <FinanceProvider>
          <div className="flex min-h-screen">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 ml-64">
              <main className="min-h-screen p-8">
                {children}
              </main>
              <footer className="bg-charcoal-dark text-white py-4 text-center text-sm">
                <p>ATO-Accurate Calculations | FY 2025-26</p>
              </footer>
            </div>
          </div>
        </FinanceProvider>
      </body>
    </html>
  );
}
