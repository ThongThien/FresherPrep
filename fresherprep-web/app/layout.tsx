import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const themeScript = `
(() => {
  try {
    const saved = localStorage.getItem("fresherprep-theme");
    const preference = saved === "light" || saved === "dark" || saved === "system" ? saved : "light";
    const resolved = preference === "system"
      ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : preference;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.style.colorScheme = resolved;
  } catch {
    document.documentElement.dataset.theme = "light";
  }
})();
`;

const languageScript = `
(() => {
  try {
    const locale = localStorage.getItem("fresherprep-language") === "en" ? "en" : "vi";
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
  } catch {
    document.documentElement.lang = "vi";
  }
})();
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FresherPrep",
    template: "%s | FresherPrep",
  },
  description: "A focused Java Backend learning and interview preparation platform.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: languageScript }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
