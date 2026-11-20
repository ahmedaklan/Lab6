import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SplitSmart — shared expenses, sorted",
  description: "Keep group expenses simple and split them fairly.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
