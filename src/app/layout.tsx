import type { Metadata, Viewport } from "next";
import { Google_Sans } from "next/font/google";
import "@fontsource-variable/oswald";
import "./globals.css";

const googleSans = Google_Sans({ variable: "--font-google-sans", subsets: ["latin", "devanagari"], weight: "variable", display: "swap" });

export const metadata: Metadata = {
  title: "Fuel & Lift — gym tracker & meal planner",
  description: "Log your lifts, plan high-protein Indian meals, search 7,000+ foods and play macro mini-games. Free, no sign-up.",
  appleWebApp: { capable: true, title: "Fuel & Lift", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0a0b0d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${googleSans.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
