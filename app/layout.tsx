import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import Script from "next/script";
import RightRail from "@/components/RightRail";
import ScrollTopButton from "@/components/ScrollTopButton";
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

// Sayfa boyanmadan önce temayı uygular; açık/koyu geçişte beyaz yanıp sönme olmaz.
const themeScript = `try{var t=localStorage.getItem("tema");var d=t?t==="koyu":matchMedia("(prefers-color-scheme: dark)").matches;var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${sourceSans.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="tema"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body className="flex min-h-dvh flex-col bg-page font-sans text-ink">
        <SiteHeader />

        <div className="mx-auto grid w-full max-w-[1200px] flex-1 gap-8 px-4 py-6 md:grid-cols-[minmax(0,1fr)_280px] lg:grid-cols-[250px_minmax(0,1fr)_280px]">
          <aside className="hidden lg:block">
            <div className="ince-kaydirma sticky top-6 max-h-[calc(100dvh-3rem)] overflow-y-auto pr-2">
              <TopicSidebar />
            </div>
          </aside>

          <main className="min-w-0">{children}</main>

          <aside className="hidden md:block">
            <div className="sticky top-6">
              <RightRail />
            </div>
          </aside>
        </div>

        <SiteFooter />
        <ScrollTopButton />
      </body>
    </html>
  );
}
