import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Royalty Details Admin",
  description: "Internal dashboard for form submissions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
