import type { Metadata } from "next";
import "./globals.css";
import { AudioPlayerProvider } from "@/components/AudioPlayer";
import { PlayerBar } from "@/components/PlayerBar";

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
  return (
    <html lang="en">
      <body>
        <AudioPlayerProvider>
          {children}
          <PlayerBar />
        </AudioPlayerProvider>
      </body>
    </html>
  );
}
