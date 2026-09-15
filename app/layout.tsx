import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import RightRail from "@/components/RightRail";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import TopicSidebar from "@/components/TopicSidebar";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: { default: "Zihin Sözlük", template: "%s · Zihin Sözlük" },
  description: "Stoa, psikoloji ve zihinsel dayanıklılık platformu",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${sourceSans.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col bg-page font-sans text-ink">
        <SiteHeader />
        <div className="mx-auto w-full max-w-2xl flex-1 lg:grid lg:max-w-6xl lg:grid-cols-[240px_minmax(0,1fr)_280px] lg:gap-8 lg:px-4">
          <aside className="hidden lg:block">
            <div className="sticky top-0 max-h-dvh overflow-y-auto overscroll-contain py-5 pr-3 [scrollbar-width:thin]">
              <TopicSidebar />
            </div>
          </aside>
          <main className="min-w-0 border-line sm:border-x lg:border-x-0 lg:py-2">
            {children}
          </main>
          <aside className="hidden lg:block">
            <RightRail />
          </aside>
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
