import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KanFlow — Fun Real-time Kanban",
  description: "A playful, real-time Kanban board for teams",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={sora.variable}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
