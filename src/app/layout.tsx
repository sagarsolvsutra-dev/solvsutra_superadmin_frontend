import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SolvSutra Super Admin",
  description: "Central Subscription & Client Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} min-h-full flex flex-col`} suppressHydrationWarning>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
          theme="light"
          toastOptions={{
            classNames: {
              toast: "group toast !bg-white !text-gray-900 !border !border-gray-200 !shadow-xl !rounded-xl !p-4 !font-sans !flex !items-center !gap-3 !text-sm",
              success: "!text-green-800 !bg-green-50 !border-green-200",
              error: "!text-red-800 !bg-red-50 !border-red-200",
              info: "!text-blue-800 !bg-blue-50 !border-blue-200",
              warning: "!text-yellow-800 !bg-yellow-50 !border-yellow-200",
            },
          }}
        />
      </body>
    </html>
  );
}
