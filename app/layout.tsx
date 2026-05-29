import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarDekho — Car Recommendations",
  description: "Natural language car recommendations with tradeoff analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
