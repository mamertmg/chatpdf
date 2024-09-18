import type { Metadata } from "next";
import { Inter } from "next/font/google";
import {ClerkProvider} from '@clerk/nextjs'
import Providers from "@/components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChatPDF",
  description: "ChatPDF"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <Providers>
        <html lang="en">
          <body>
            {children}
          </body>
          </html>
      </Providers>
    </ClerkProvider>
  );
}
