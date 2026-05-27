// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/evento/(.*)',        // ← Muy importante
  '/api/registro(.*)',   // Para el registro
  '/api/events(.*)',     
  '/api/cron(.*)'        // ← Hacemos públicas todas las tareas programadas de Vercel
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return; // Permite acceso público (la seguridad la maneja el CRON_SECRET)
  }
  
  // Protege todas las demás rutas
  await auth.protect();
});

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
}