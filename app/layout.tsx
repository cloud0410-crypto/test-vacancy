import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PM Career Intelligence",
  description: "Discover product management roles and assess resume alignment.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
