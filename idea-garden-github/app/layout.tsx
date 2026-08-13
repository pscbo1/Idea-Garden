import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Idea Garden Test",
  description: "Capture, develop, and grow ideas in this browser.",
  manifest: "/manifest.webmanifest",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/assets/plants/plant-0.png",
    shortcut: "/assets/plants/plant-0.png",
    apple: "/assets/plants/plant-0.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#dfeee3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
