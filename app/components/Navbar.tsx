// app/components/Navbar.tsx
'use client';

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-black">
            EventFlow
          </Link>

          {/* Menú Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <SignedIn>
              <Link href="/dashboard" className="hover:text-black transition">Dashboard</Link>
              <Link href="/eventos" className="hover:text-black transition">Mis Eventos</Link>
            </SignedIn>
          </div>

          {/* Botones Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal">
                <button className="font-medium hover:text-black transition">Iniciar Sesión</button>
              </SignInButton>
              <Link 
                href="/sign-up" 
                className="bg-black text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 transition"
              >
                Registrarse
              </Link>
            </SignedOut>
          </div>

          {/* Botón Hamburguesa (Mobile) */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-700"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Menú Mobile */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4">
            <div className="flex flex-col gap-4 text-lg">
              <SignedIn>
                <Link href="/dashboard" className="hover:text-black transition" onClick={() => setIsOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/eventos" className="hover:text-black transition" onClick={() => setIsOpen(false)}>
                  Mis Eventos
                </Link>
                <div className="pt-4">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>

              <SignedOut>
                <SignInButton mode="modal">
                  <button className="font-medium hover:text-black transition" onClick={() => setIsOpen(false)}>
                    Iniciar Sesión
                  </button>
                </SignInButton>
                <Link 
                  href="/sign-up" 
                  className="bg-black text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Registrarse
                </Link>
              </SignedOut>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}