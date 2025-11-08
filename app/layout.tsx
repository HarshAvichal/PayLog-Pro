import type { Metadata } from "next";
import "./globals.css";
import ServiceWorkerRegistration from "./ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "PayLog - Pay Period Tracker",
  description: "Track your pay periods and shifts",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PayLog",
  },
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
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
