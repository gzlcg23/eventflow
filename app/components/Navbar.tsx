// app/components/Navbar.tsx
'use client';

import Link from "next/link";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";

export default function Navbar() {
  const { isSignedIn } = useUser();

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-black">
          EventFlow
        </Link>

        <div className="flex items-center gap-6">
          {isSignedIn ? (
            // Usuario logueado
            <>
              <Link href="/dashboard" className="hover:text-black transition">Dashboard</Link>
              <Link href="/eventos" className="hover:text-black transition">Mis Eventos</Link>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            // Usuario no logueado
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
      </div>
    </nav>
  );
}