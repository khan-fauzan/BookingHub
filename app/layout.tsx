import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header, Footer } from "@/components/layout";
import { AuthProvider } from "@/lib/auth/auth-context";
import { AmplifyConfigProvider } from "@/components/providers/amplify-config-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hotel Booking Platform - Find & Book Your Perfect Stay",
  description: "Discover and book the perfect accommodation for your next trip. Compare prices, read reviews, and find great deals on hotels, apartments, and resorts worldwide.",
  keywords: ["hotel booking", "accommodation", "travel", "vacation rentals", "resorts"],
  authors: [{ name: "Hotel Booking Platform" }],
  openGraph: {
    title: "Hotel Booking Platform - Find & Book Your Perfect Stay",
    description: "Discover and book the perfect accommodation for your next trip.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <AmplifyConfigProvider>
          <AuthProvider>
            <Header />
            {children}
            <Footer />
          </AuthProvider>
        </AmplifyConfigProvider>
      </body>
    </html>
  );
}
