import type { Metadata, Viewport } from "next";
import { Courier_Prime } from "next/font/google";
import Script from "next/script";

import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

import "./globals.css";

const courierPrime = Courier_Prime({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-courier-prime",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ntrr — Family Care Orchestrator",
  description:
    "Secure coordination hub for sandwich-generation families and caregivers. One dashboard for tasks, calendars, and family alignment.",
  applicationName: "ntrr",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon-192.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    title: "ntrr",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${courierPrime.variable} font-sans antialiased`}>
        {process.env.NODE_ENV !== "production" ? (
          <Script id="dev-sw-cleanup" strategy="beforeInteractive">
            {`if('serviceWorker'in navigator){navigator.serviceWorker.getRegistrations().then(function(r){r.forEach(function(x){x.unregister()})})}if('caches'in window){caches.keys().then(function(k){k.forEach(function(n){caches.delete(n)})})}`}
          </Script>
        ) : null}
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}