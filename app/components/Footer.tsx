// components/Footer.tsx
import Link from "next/link";

interface FooterProps {
  variant?: "light" | "dark";
}

export default function Footer({ variant = "light" }: FooterProps) {
  const currentYear = new Date().getFullYear();

  // Estilos dinámicos según el contexto visual
  const bgStyle = variant === "dark" ? "bg-black border-zinc-800" : "bg-gray-50 border-gray-200";
  const textPrimary = variant === "dark" ? "text-white" : "text-gray-900";
  const textMuted = variant === "dark" ? "text-zinc-500" : "text-gray-500";
  const linkHover = variant === "dark" ? "hover:text-zinc-300" : "hover:text-gray-900";

  return (
    <footer className={`w-full border-t py-12 ${bgStyle}`}>
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm">
        
        {/* Identidad */}
        <div className="flex flex-col items-center sm:items-start gap-1">
          <p className={`font-bold tracking-tight text-lg ${textPrimary}`}>
            EventFlow
          </p>
          <p className={textMuted}>
            Gestión inteligente de accesos y registros digitales.
          </p>
        </div>

        {/* Enlaces Legales y Copyright */}
        <div className="flex flex-col items-center sm:items-end gap-3">
          <div className="flex items-center gap-6 font-medium text-xs">
            <Link 
              href="/privacidad" 
              className={`${textMuted} ${linkHover} transition-colors underline-offset-4 hover:underline`}
            >
              Aviso de Privacidad
            </Link>
            <Link 
              href="/terminos" 
              className={`${textMuted} ${linkHover} transition-colors underline-offset-4 hover:underline`}
            >
              Términos y Condiciones
            </Link>
          </div>
          <p className={`text-xs ${textMuted}`}>
            &copy; {currentYear} EventFlow. Todos los derechos reservados.
          </p>
        </div>

      </div>
    </footer>
  );
}