import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { NavigationProgress } from "@/components/navigation-progress";
import { PRIMARY_COLORS } from "@/lib/primary-colors";
import {
  PRIMARY_COLOR_COOKIE,
  resolvePrimaryColorId,
} from "@/store/client/primary-color-slice";
import "@/styles/globals.css";
import { fontSans, fontMono, fontPoppins, fontBrand } from "@/styles/font";
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

export default async function RootLayout({
  children,
}: Readonly<RootLayoutProps>) {
  const cookieStore = await cookies();
  const primaryColor = resolvePrimaryColorId(
    cookieStore.get(PRIMARY_COLOR_COOKIE)?.value,
  );
  const primaryStyle = {
    "--primary": PRIMARY_COLORS.get(primaryColor)?.value,
  } as React.CSSProperties;

  return (
    <html
      lang="en"
      data-primary={primaryColor}
      style={primaryStyle}
      suppressHydrationWarning
    >
      <body
        className={`${fontSans.variable} ${fontMono.variable} ${fontPoppins.variable} ${fontBrand.variable} antialiased`}
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
