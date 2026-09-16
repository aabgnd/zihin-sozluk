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
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-page font-sans text-ink">
        <SiteHeader />
        <div className="mx-auto grid w-full max-w-7xl flex-1 gap-4 px-3 py-4 md:grid-cols-[250px_minmax(0,1fr)] md:px-5 lg:grid-cols-[250px_minmax(0,1fr)_300px] lg:gap-6">
          <aside className="hidden md:block">
            <div className="sticky top-4">
              <TopicSidebar />
            </div>
          </aside>
          <main className="min-w-0">{children}</main>
          <aside className="hidden lg:block">
            <div className="sticky top-4">
              <RightRail />
            </div>
          </aside>
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
