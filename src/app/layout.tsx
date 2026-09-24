import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Soul of Islam Video Maker | Premium Video Generator",
  description: "Create breathtaking, professional Islamic videos from images or text in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Montserrat:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,700&family=Scheherazade+New:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased text-gray-100 min-h-screen flex flex-col relative`}>
        {/* Background glow effects */}
        <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#059669]/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#d97706]/10 blur-[120px]" />
        </div>

        <header className="border-b border-white/5 py-3 px-6 sticky top-0 z-50 backdrop-blur-xl bg-[#030712]/85">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-[#059669] via-[#10b981] to-[#d97706] tracking-wide">
                SOUL OF ISLAM
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                Studio 2.0
              </span>
            </Link>

            <nav className="flex items-center gap-2">
              <Link
                href="/editor"
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10"
              >
                Studio Dashboard
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center justify-start max-w-6xl w-full mx-auto px-4 py-4 sm:px-6">
          {children}
        </main>

        <footer className="py-6 border-t border-white/5 mt-auto bg-[#030712]/60 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Soul of Islam Studio. Made for viral TikTok, Reels & Shorts.
          </div>
        </footer>
      </body>
    </html>
  );
}
