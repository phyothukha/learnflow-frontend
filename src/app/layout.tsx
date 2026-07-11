import type { Metadata } from "next";
import "@/styles/globals.css";
import { fontSans, fontMono } from "@/styles/font";
import Providers from "@/app/provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "LearnFlow",
  description: "LearnFlow admin dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fontSans.variable} ${fontMono.variable} antialiased`}>
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
