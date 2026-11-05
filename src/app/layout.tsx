import type { Metadata, Viewport } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Forma — food, movement & daily rhythm",
  description: "A calmer way to track food, workouts, water and protein. Personal reminders, real exercise demos and your own daily rhythm.",
  appleWebApp: { capable: true, title: "Forma", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#f5f4ef",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
