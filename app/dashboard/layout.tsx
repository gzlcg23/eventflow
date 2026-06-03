// app/dashboard/layout.tsx
import Footer from "../components/Footer"; // Verifica si en VS Code te pide un punto "." o dos ".."

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 'w-full' asegura que nada se comprima al centro
    <div className="flex-1 flex flex-col w-full">
      
      {/* Contenedor del contenido principal sin límites 'max-w' restrictivos */}
      <div className="flex-1 w-full px-6 py-10">
        {children}
      </div>

      {/* 🌟 Tu footer profesional claro al fin se renderizará abajo del dashboard */}
      <Footer variant="light" />
    </div>
  );
}