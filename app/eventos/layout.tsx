// app/eventos/layout.tsx
import Footer from "../components/Footer"; // Conserva la ruta que te funcionó en VS Code

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 1. Mantenemos el flujo vertical sin alterar fondos (usa el fondo claro del RootLayout)
    <div className="flex-1 flex flex-col w-full">
      
      {/* 2. Contenedor a ancho completo (w-full) para que tus gráficas y eventos no se aprieten */}
      <div className="flex-1 w-full">
        {children}
      </div>

      {/* 3. El Footer en variante clara para hacer juego con tu diseño original */}
      <Footer variant="light" />
    </div>
  );
}