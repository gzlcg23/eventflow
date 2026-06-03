// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "./components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EventFlow",
  description: "Gestión inteligente de eventos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="es" className="h-full">
        {/* Usamos w-full min-h-screen y aseguramos que no haya max-w aquí */}
        <body className={`${inter.className} flex flex-col min-h-screen w-full bg-white text-gray-900 antialiased`}>
          <Navbar />
          {/* flex-1 toma todo el espacio vertical y w-full el horizontal */}
          <main className="flex-1 flex flex-col w-full">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}