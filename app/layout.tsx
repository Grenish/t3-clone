import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { LayoutProvider } from "@/util/layout-provider";
import { ThemeProvider } from "@/util/theme-provider";
import { ConditionalLayout } from "@/components/conditional-layout";

const mont = Montserrat({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: "normal",
  display: "swap"
})

export const metadata: Metadata = {
  title: "T3 Chat Clone",
  description: "T3 Chat is a clone app of the popular chat web application T3 Chat. But this clone is better.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${mont.className} antialiased`}
      >
        <ThemeProvider>
          <LayoutProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </LayoutProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
