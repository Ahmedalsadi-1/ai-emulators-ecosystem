import type React from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
      <body className={bartle.className}>{children}</body>
    </html>
  );
}
