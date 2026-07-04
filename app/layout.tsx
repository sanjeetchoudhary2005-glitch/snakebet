import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SnakebetProvider } from "@/context/SnakebetContext";
import { SessionProvider } from "@/context/SessionContext";
import { WalletProvider } from "@/context/WalletContext";
import { ChatWidget } from "@/components/ChatWidget";
import { WelcomeBonus } from "@/components/WelcomeBonus";
import { SessionReminder } from "@/components/SessionReminder";
import { FirstVisitOnboarding } from "@/components/FirstVisitOnboarding";
import { PageTransition } from "@/components/PageTransition";

export const metadata: Metadata = {
  title: {
    default: "Snakebet - Play Beyond Limits",
    template: "%s | Snakebet"
  },
  description: "Premium online gaming platform with provably fair games, instant withdrawals, and 50K+ players. Enjoy Mines, Crash, Plinko, and more!",
  keywords: ["online casino", "crash game", "mines game", "plinko", "provably fair", "instant withdrawals", "Snakebet"],
  authors: [{ name: "Snakebet" }],
  creator: "Snakebet",
  publisher: "Snakebet",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://Snakebet.com",
    siteName: "Snakebet",
    title: "Snakebet - Play Beyond Limits",
    description: "Premium online gaming platform with provably fair games, instant withdrawals, and 50K+ players.",
    images: [{
      url: "https://Snakebet.com/og-image.jpg",
      width: 1200,
      height: 630,
      alt: "Snakebet - Play Beyond Limits",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Snakebet - Play Beyond Limits",
    description: "Premium online gaming platform with provably fair games, instant withdrawals, and 50K+ players.",
    images: ["https://Snakebet.com/twitter-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: "your-google-verification-code",
  },
  alternates: {
    canonical: "https://Snakebet.com",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FFFFFF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Snakebet" />
      </head>
      <body className={`antialiased`}>
        <SessionProvider>
          <SnakebetProvider>
            <WalletProvider>
              <Navbar />
              <main className="min-h-screen">
                <PageTransition>{children}</PageTransition>
              </main>
              <Footer />
              <WelcomeBonus />
              <FirstVisitOnboarding />
              <SessionReminder />
              <ChatWidget />
            </WalletProvider>
          </SnakebetProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
