'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignInButton } from "@clerk/nextjs";

export default function Navbar() {
  const pathname = usePathname();
  const isPublicEventPage = pathname?.startsWith('/evento/');

  // === NAVBAR PARA PÁGINAS PÚBLICAS ===
  if (isPublicEventPage) {
    return (
      <nav className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            EventFlow
          </Link>
          <span className="text-sm text-gray-500">Registro de Asistentes</span>
        </div>
      </nav>
    );
  }

  // === NAVBAR PARA ADMINISTRADORES ===
  return (
    <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            EventFlow
          </Link>
          
          <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
            <Link href="/dashboard" className="hover:text-gray-900 transition">Dashboard</Link>
            <Link href="/eventos" className="hover:text-gray-900 transition">Mis Eventos</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
}