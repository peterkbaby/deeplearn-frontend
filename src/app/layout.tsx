import type { Metadata } from "next";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "./globals.css";
import { ToastProvider } from "@/components/toast";
import { AppStateProvider } from "@/components/app-state-provider";
export const metadata: Metadata = {
  title: { default: "Still — A little space to play", template: "%s · Still" },
  description:
    "A little less noise. A little more focus. Your space to pause, connect, and play.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <AppStateProvider>
          <ToastProvider>{children}</ToastProvider>
        </AppStateProvider>
      </body>
    </html>
  );
}
