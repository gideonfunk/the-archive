import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Archive — Five Voices, One Signal",
  description: "A living archive of songs, sketches, and sonic artifacts by Gideon Funk.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "The Archive — Five Voices, One Signal",
    description: "Independent transmissions by Gideon Funk.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
