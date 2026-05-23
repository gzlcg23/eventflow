import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Permite que los despliegues de producción terminen exitosamente 
    // incluso si el proyecto tiene errores de TypeScript.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;