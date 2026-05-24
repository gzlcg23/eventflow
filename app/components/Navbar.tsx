// app/components/Navbar.tsx
'use client';

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";

export default function Navbar() {
  const { isSignedIn, isLoaded } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  if (!isLoaded) {
    return (
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-black">EventFlow</Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo + Menú Desktop */}
        <div className="flex items-center gap-10">
          <Link href="/" className="text-2xl font-bold text-black">
            EventFlow
          </Link>

          {isSignedIn && (
            <div className="hidden md:flex items-center gap-8">
              <Link href="/eventos" className="hover:text-black transition font-medium">Mis Eventos</Link>
              <Link href="/dashboard" className="hover:text-black transition font-medium">Dashboard</Link>
            </div>
          )}
        </div>

        {/* Acciones Desktop */}
        <div className="hidden md:flex items-center gap-4">
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="font-medium hover:text-black transition">Iniciar Sesión</button>
              </SignInButton>
              <Link 
                href="/sign-up" 
                className="bg-black text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 transition"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>

        {/* Botón Hamburguesa */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-gray-700 p-2"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Menú Mobile Flotante */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-50 md:hidden"
          onClick={() => setIsOpen(false)} // Clic fuera cierra el menú
        >
          <div 
            className="bg-white h-full w-4/5 max-w-xs ml-auto shadow-xl"
            onClick={(e) => e.stopPropagation()} // Evita cerrar al clicar dentro
          >
            <div className="p-6 flex justify-between items-center border-b">
              <Link href="/" className="text-2xl font-bold text-black" onClick={() => setIsOpen(false)}>
                EventFlow
              </Link>
              <button onClick={() => setIsOpen(false)}>
                <X size={28} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6 text-lg">
              {isSignedIn ? (
                <>
                  <Link href="/eventos" className="hover:text-black transition" onClick={() => setIsOpen(false)}>
                    Mis Eventos
                  </Link>
                  <Link href="/dashboard" className="hover:text-black transition" onClick={() => setIsOpen(false)}>
                    Dashboard
                  </Link>
                  <div className="pt-6">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <button className="font-medium hover:text-black transition w-full text-left" onClick={() => setIsOpen(false)}>
                      Iniciar Sesión
                    </button>
                  </SignInButton>
                  <Link 
                    href="/sign-up" 
                    className="bg-black text-white px-6 py-3.5 rounded-2xl text-center hover:bg-gray-800 transition"
                    onClick={() => setIsOpen(false)}
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}