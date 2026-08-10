import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import AiChatWidget from "@/components/AiChatWidget";
import BackButton from "@/components/BackButton";
import NavigationInitializer from "@/components/NavigationInitializer";

export const metadata: Metadata = {
  title: "JobStock - Job Portal",
  description: "Find your career to make a better life",
  icons: {
    icon: "/assets/img/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/assets/css/styles.css" />
        <link rel="stylesheet" href="/assets/css/colors.css" />
        <link
          href="https://cdn.jsdelivr.net/npm/@mdi/font/css/materialdesignicons.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <div id="main-wrapper">
            {children}
            <AiChatWidget />
            <BackButton />
            <NavigationInitializer />
          </div>
        </AuthProvider>

        <Script
          src="/assets/js/jquery.min.js"
          strategy="beforeInteractive"
        />
        <Script src="/assets/js/popper.min.js" strategy="beforeInteractive" />
        <Script src="/assets/js/bootstrap.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/rangeslider.js" strategy="afterInteractive" />
        <Script
          src="/assets/js/jquery.nice-select.min.js"
          strategy="afterInteractive"
        />
        <Script src="/assets/js/slick.js" strategy="afterInteractive" />
        <Script src="/assets/js/counterup.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/custom.js" strategy="afterInteractive" />
        <Script src="/assets/js/main.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
