// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// 1. Definimos todas las rutas que Clerk debe ignorar y dejar totalmente públicas
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/evento/(.*)',        
  '/api/registro(.*)',   
  '/api/events(.*)',     
  '/api/cron(.*)',       
  '/api/auth(.*)',       // Callback interno de Clerk/Google
  '/sso-callback(.*)'    // Redirecciones de Google OAuth en producción
]);

export default clerkMiddleware(async (auth, req) => {
  // 2. Si la ruta coincide con la lista pública, no hacemos nada y dejamos pasar el flujo
  if (isPublicRoute(req)) {
    return; 
  }
  
  // 3. Protege de forma estricta el resto de las rutas privadas (ej. /dashboard)
  await auth.protect();
});

export const config = {
  matcher: [
    // El matcher oficial de Clerk modificado para producción:
    // Evita ejecutar el middleware en archivos estáticos (.html, .css, .js, imágenes, etc.) y rutas internas de Next.js
    '/((?!_next|[^?]*\\.[\\w]+$|api/auth).*)',
    // Obliga a que el middleware se ejecute siempre para las APIs y las páginas raíz
    '/(api|trpc)(.*)',
  ],
};