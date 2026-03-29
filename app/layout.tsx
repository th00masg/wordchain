import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "🔤 Ordkjede!",
  description: "Bygg ordkjeder med venner!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no">
      <body className="fun-bg min-h-screen text-white antialiased">
        {children}
      </body>
    </html>
  );
}
