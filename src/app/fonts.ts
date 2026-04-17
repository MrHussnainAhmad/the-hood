import { DM_Serif_Display, Manrope } from "next/font/google";

export const dmSans = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

export const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  variable: "--font-dm-serif",
});
