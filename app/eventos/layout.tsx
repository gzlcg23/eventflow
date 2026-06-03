// app/eventos/layout.tsx
import Footer from "../components/Footer"; // 🌟 Ajusta la ruta relativa si tu carpeta components está en otro lado

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Forzamos fondo oscuro premium para la sección privada del SaaS
    <div className="flex-1 flex flex-col bg-zinc-950 text-zinc-100">
      
      {/* Contenedor del panel interno */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>

      {/* 🌟 Footer profesional oscuro automático para todo el interior */}
      <Footer variant="dark" />
    </div>
  );
}