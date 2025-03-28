import type { Metadata } from "next";
import { Rajdhani } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import RootLayout from "@/components/layout/RootLayout";
import { AuthProvider } from "@/contexts/AuthContext";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
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
      <body className={rajdhani.className}>
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
