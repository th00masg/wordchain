import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ordkjede",
  description: "Flerspiller ordkjede-spill på norsk",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no">
      <body className="min-h-screen bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
