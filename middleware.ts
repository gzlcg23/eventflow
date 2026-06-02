// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas públicas (no requieren autenticación)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/evento/(.*)',
  '/api/registro(.*)',
  '/api/events(.*)',
  '/api/cron(.*)',
  '/api/auth(.*)',
  '/sso-callback(.*)',
  '/ayuda',
]);

// Rutas que requieren protección CSRF (POST, PUT, DELETE)
const isMutatingRoute = createRouteMatcher([
  '/api/(.*)',
  '/eventos/nuevo',
  '/eventos/editar/(.*)',
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // 1. Rutas públicas → dejar pasar
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // 2. Proteger rutas privadas
  await auth.protect();

  // 3. Protección CSRF para rutas mutantes (POST, PUT, DELETE)
  if (isMutatingRoute(req) && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const csrfTokenFromCookie = req.cookies.get('__Host-csrf-token')?.value;
    const csrfTokenFromHeader = req.headers.get('x-csrf-token');

    if (!csrfTokenFromCookie || !csrfTokenFromHeader || csrfTokenFromCookie !== csrfTokenFromHeader) {
      return NextResponse.json({ error: "CSRF token inválido. Por favor recarga la página." }, { status: 403 });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.[\\w]+$|api/auth).*)',
    '/(api|trpc)(.*)',
  ],
};