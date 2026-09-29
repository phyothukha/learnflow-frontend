import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { NavigationProgress } from "@/components/navigation-progress";
import { primaryColorInitScript } from "@/config/primary-colors";
import "@/styles/globals.css";
import { fontSans, fontMono, fontPoppins } from "@/styles/font";
import Providers from "@/app/provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "LearnFlow Admin",
    template: "%s · LearnFlow",
  },
  description:
    "LearnFlow admin dashboard for managing courses, enrollments, and learner progress.",
  applicationName: "LearnFlow",
  keywords: [
    "LearnFlow",
    "learning management",
    "admin dashboard",
    "courses",
    "enrollments",
  ],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "LearnFlow Admin",
    description:
      "LearnFlow admin dashboard for managing courses, enrollments, and learner progress.",
    siteName: "LearnFlow",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#007C6A",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: primaryColorInitScript }} />
      </head>
      <body
        className={`${fontSans.variable} ${fontMono.variable} ${fontPoppins.variable} antialiased`}
      >
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
