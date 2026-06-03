// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 1. Rutas públicas (no requieren autenticación en el escudo inicial de Clerk)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/evento/(.*)',  
  '/privacidad(.*)', 
  '/terminos(.*)',      
  '/api/registro(.*)',   
  '/api/events(.*)',     
  '/api/eventos/(.*)',   
  '/api/checkin(.*)',     // Permitimos que la API de Check-In sea accesible
  '/api/cron(.*)',       
  '/api/auth(.*)',       
  '/sso-callback(.*)'    
]);

// 2. Rutas del panel que SÍ requieren validación CSRF estricta obligatoria
const isCsrfProtectedPage = createRouteMatcher([
  '/eventos/nuevo',
  '/eventos/editar/(.*)',
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // A. Si es una ruta pública, la dejamos pasar de inmediato sin validar nada más
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // B. Proteger todas las demás rutas privadas con Clerk
  await auth.protect();

  // C. Filtro inteligente para la protección CSRF manual (Solo métodos mutantes)
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    
    // REGLA DE ORO: Si la petición va a nuestras APIs optimizadas, NO le exijas CSRF token
    const isExemptedApi = pathname.startsWith('/api/checkin') || 
                          pathname.startsWith('/api/registro') || 
                          pathname.startsWith('/api/events') || 
                          pathname.startsWith('/api/eventos');

    // Si está en las páginas protegidas o es cualquier OTRA api que no esté exenta, validamos token
    if (isCsrfProtectedPage(req) || (pathname.startsWith('/api/') && !isExemptedApi)) {
      const csrfTokenFromCookie = req.cookies.get('__Host-csrf-token')?.value;
      const csrfTokenFromHeader = req.headers.get('x-csrf-token');

      if (!csrfTokenFromCookie || !csrfTokenFromHeader || csrfTokenFromCookie !== csrfTokenFromHeader) {
        return NextResponse.json({ error: "CSRF token inválido. Por favor recarga la página." }, { status: 403 });
      }
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