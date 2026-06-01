// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/evento/(.*)',        
  '/api/registro(.*)',   
  '/api/events(.*)',     
  '/api/cron(.*)',       
  '/api/auth(.*)',       // ← OBLIGATORIO: Permite los callbacks internos de Clerk/Google
  '/sso-callback(.*)'    // ← OBLIGATORIO: Permite las redirecciones de Single Sign-On en producción
]);

export default clerkMiddleware(async (auth, req) => {
  // 1. Si es una ruta pública o interna de autenticación, no hagas nada y deja pasar la petición
  if (isPublicRoute(req)) {
    return; 
  }
  
  // 2. Protege todas las demás rutas privadas
  await auth.protect();
});

export const config = {
  matcher: [
    // Ignora los internos de Next.js y todos los archivos estáticos (imágenes, favicons, etc.)
    '/((?!_next|[^?]*\\.[\\w]+$|api/auth).*)',
    // Asegura que se ejecute para las rutas principales y APIs
    '/',
    '/(api|trpc)(.*)',
  ],
}