import type React from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TitleBar } from "@/components/title-bar";

const bartle = localFont({
  src: "./../../public/fonts/BBHBartle-Regular.ttf",
  display: "swap",
  variable: "--font-bartle",
});

export const metadata: Metadata = {
  title: "Bytebot",
  description: "Bytebot is the container for desktop agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bartle.className}>
        <TitleBar />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
