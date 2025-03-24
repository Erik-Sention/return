import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import RootLayout from "@/components/layout/RootLayout";
import { AuthProvider } from "@/contexts/AuthContext";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ROI-kalkylator - Hälsofrämjande insatser",
  description: "Beräkna avkastning på investering för hälsofrämjande insatser",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <body className={geist.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <RootLayout>{children}</RootLayout>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
