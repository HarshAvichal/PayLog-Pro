import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PayLog - Pay Period Tracker",
  description: "Track your pay periods and shifts",
  icons: {
    icon: "/sleep.png",
    shortcut: "/sleep.png",
    apple: "/sleep.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

