import { Geist, Geist_Mono, Lexend, Poppins } from "next/font/google";

export const fontSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const fontMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const fontPoppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const fontBrand = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  weight: ["700", "800"],
});
