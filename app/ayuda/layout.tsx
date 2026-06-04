//  app/ayuda/layout.tsx
import Footer from "../components/Footer";

export default function AyudaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col w-full">
      <div className="flex-1 w-full px-6 py-10">
        {children}
      </div>
      <Footer variant="light" />
    </div>
  );
}